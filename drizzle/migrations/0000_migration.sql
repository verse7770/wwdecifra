
create type public.app_role as enum ('admin','moderator','user');
create type public.exam_kind as enum ('enem','vestibular','concurso');
create type public.validation_status as enum ('pendente','validado','rejeitado');
create type public.question_origin as enum ('oficial','autoral','ia');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  exam_kind public.exam_kind default 'enem',
  exam_name text default 'ENEM',
  exam_date date,
  goal text,
  daily_goal_minutes int not null default 120,
  level text default 'intermediario',
  difficult_subjects text[] default '{}',
  xp int not null default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- CATALOG (public read, admin write)
create table public.areas (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, sort int default 0);
create table public.subjects (id uuid primary key default gen_random_uuid(), area_id uuid references public.areas(id) on delete cascade, slug text unique not null, name text not null, sort int default 0);
create table public.topics (id uuid primary key default gen_random_uuid(), subject_id uuid references public.subjects(id) on delete cascade not null, name text not null, parent_id uuid references public.topics(id) on delete set null, sort int default 0, unique(subject_id, name));
create table public.institutions (id uuid primary key default gen_random_uuid(), name text unique not null, kind public.exam_kind not null, board text, website text);
create table public.exams (id uuid primary key default gen_random_uuid(), institution_id uuid references public.institutions(id) on delete cascade not null, year int not null, edition text, source_url text, data_available boolean not null default false, notes text, validation public.validation_status not null default 'pendente', updated_at timestamptz not null default now());
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  number int, statement text not null, skill text, difficulty int default 2 check (difficulty between 1 and 3),
  correct_label text not null, explanation text,
  origin public.question_origin not null default 'autoral',
  source_url text, validation public.validation_status not null default 'pendente',
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.question_options (id uuid primary key default gen_random_uuid(), question_id uuid references public.questions(id) on delete cascade not null, label text not null, text text not null, unique(question_id,label));
create table public.topic_incidence (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics(id) on delete cascade not null,
  exam_id uuid references public.exams(id) on delete cascade not null,
  question_count int not null, source_url text, validation public.validation_status not null default 'pendente',
  updated_at timestamptz not null default now(), unique(topic_id, exam_id)
);
create table public.news (id uuid primary key default gen_random_uuid(), title text not null, summary text not null, category text not null, source_name text not null, source_url text not null, published_at date not null, created_at timestamptz default now());
create table public.achievements (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, description text not null, icon text default 'trophy', xp int default 50);

do $$ declare t text; begin
  foreach t in array array['areas','subjects','topics','institutions','exams','questions','question_options','topic_incidence','news','achievements'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

-- USER DATA
create table public.answers (id uuid primary key default gen_random_uuid(), user_id uuid not null, question_id uuid references public.questions(id) on delete cascade not null, chosen_label text not null, is_correct boolean not null, time_seconds int default 0, simulation_id uuid, created_at timestamptz not null default now());
create table public.favorites (user_id uuid not null, question_id uuid references public.questions(id) on delete cascade not null, created_at timestamptz default now(), primary key(user_id, question_id));
create table public.simulations (id uuid primary key default gen_random_uuid(), user_id uuid not null, title text not null, mode text not null, question_ids uuid[] not null, duration_minutes int, started_at timestamptz default now(), finished_at timestamptz, correct int, total int, created_at timestamptz default now());
create table public.study_plans (id uuid primary key default gen_random_uuid(), user_id uuid not null, inputs jsonb not null, plan jsonb not null, created_at timestamptz default now());
create table public.essays (id uuid primary key default gen_random_uuid(), user_id uuid not null, theme text not null, content text not null, scores jsonb, total int, feedback text, created_at timestamptz default now());
create table public.study_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null, subject_id uuid references public.subjects(id) on delete set null, minutes int not null check (minutes > 0 and minutes <= 720), activity text default 'estudo', studied_on date not null default current_date, created_at timestamptz default now());
create table public.user_achievements (user_id uuid not null, achievement_id uuid references public.achievements(id) on delete cascade not null, earned_at timestamptz default now(), primary key(user_id, achievement_id));
create table public.tutor_messages (id uuid primary key default gen_random_uuid(), user_id uuid not null, role text not null, content text not null, created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['answers','favorites','simulations','study_plans','essays','study_sessions','user_achievements','tutor_messages'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "admin read" on public.%I for select to authenticated using (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

-- XP trigger on answers
create or replace function public.award_xp() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set xp = xp + case when new.is_correct then 10 else 3 end where id = new.user_id;
  return new;
end $$;
create trigger answers_xp after insert on public.answers for each row execute function public.award_xp();

-- SEED TAXONOMY (curricular topics, not statistics)
insert into public.areas(slug,name,sort) values
('linguagens','Linguagens, Códigos e suas Tecnologias',1),('matematica','Matemática e suas Tecnologias',2),
('natureza','Ciências da Natureza',3),('humanas','Ciências Humanas',4),('redacao','Redação',5);

insert into public.subjects(area_id,slug,name,sort)
select a.id, s.slug, s.name, s.sort from (values
 ('linguagens','portugues','Língua Portuguesa e Literatura',1),('linguagens','artes','Artes e Educação Física',2),('linguagens','estrangeira','Língua Estrangeira',3),
 ('matematica','matematica','Matemática',1),
 ('natureza','fisica','Física',1),('natureza','quimica','Química',2),('natureza','biologia','Biologia',3),
 ('humanas','historia','História',1),('humanas','geografia','Geografia',2),('humanas','filosofia','Filosofia',3),('humanas','sociologia','Sociologia',4),
 ('redacao','redacao','Redação',1)
) s(area,slug,name,sort) join public.areas a on a.slug = s.area;

insert into public.topics(subject_id,name,sort)
select sub.id, t.name, t.ord from (values
 ('portugues', array['Interpretação de texto','Gêneros textuais','Funções da linguagem','Figuras de linguagem','Variação linguística','Gramática contextualizada','Literatura brasileira','Modernismo','Vanguardas artísticas']),
 ('artes', array['Artes','Educação física']),
 ('estrangeira', array['Inglês','Espanhol']),
 ('matematica', array['Matemática básica','Porcentagem','Razão e proporção','Regra de três','Equações','Funções de primeiro grau','Funções de segundo grau','Geometria plana','Geometria espacial','Trigonometria','Estatística','Probabilidade','Análise combinatória','Progressões','Matemática financeira','Interpretação de gráficos e tabelas']),
 ('fisica', array['Cinemática','Dinâmica','Leis de Newton','Trabalho e energia','Hidrostática','Termologia','Ondulatória','Óptica','Eletricidade','Circuitos elétricos']),
 ('quimica', array['Estrutura atômica','Tabela periódica','Ligações químicas','Estequiometria','Soluções','Química orgânica','Eletroquímica','Termoquímica','Cinética química','Equilíbrio químico','Química ambiental']),
 ('biologia', array['Citologia','Genética','Evolução','Ecologia','Fisiologia humana','Botânica','Zoologia','Microbiologia','Biotecnologia','Cadeias alimentares','Saúde pública']),
 ('historia', array['Brasil Colônia','Independência do Brasil','Brasil Império','República Velha','Era Vargas','Ditadura Militar','Redemocratização','Revoluções','Guerras mundiais','História contemporânea','História da África','História indígena']),
 ('geografia', array['Geografia física','Climatologia','Geopolítica','Globalização','Urbanização','Industrialização','Agricultura','Questões ambientais','Demografia','Cartografia','Geografia econômica']),
 ('filosofia', array['Filosofia antiga','Sócrates','Platão','Aristóteles','Ética','Política','Iluminismo','Filosofia moderna','Filosofia contemporânea']),
 ('sociologia', array['Cultura','Sociedade','Desigualdade social','Cidadania','Movimentos sociais','Trabalho','Globalização','Democracia','Pensadores clássicos']),
 ('redacao', array['Estrutura dissertativo-argumentativa','Introdução','Desenvolvimento','Conclusão','As cinco competências','Repertório sociocultural','Conectivos','Argumentação','Propostas de intervenção'])
) t0(slug, names)
cross join lateral unnest(t0.names) with ordinality as t(name, ord)
join public.subjects sub on sub.slug = t0.slug;

insert into public.institutions(name,kind,board,website) values
('INEP / ENEM','enem','INEP','https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem'),
('Fuvest','vestibular','Fuvest','https://www.fuvest.br'),('Unicamp','vestibular','Comvest','https://www.comvest.unicamp.br'),
('Unesp','vestibular','Vunesp','https://vestibular.unesp.br'),('UERJ','vestibular','UERJ','https://www.vestibular.uerj.br'),
('PAS/UnB','vestibular','Cebraspe','https://www.cebraspe.org.br/pas');

-- Exam editions registered but with data_available=false until validated data is imported
insert into public.exams(institution_id,year,edition,source_url,data_available,notes)
select i.id, y, 'Aplicação regular', 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos', false,
 'Edição cadastrada. Questões e incidência ainda não importadas/validadas a partir da fonte oficial.'
from public.institutions i, unnest(array[2024,2025,2026]) y where i.name = 'INEP / ENEM';

insert into public.achievements(code,name,description,icon,xp) values
('first_answer','Primeira questão','Resolveu sua primeira questão','sparkles',20),
('ten_correct','Dez acertos','Acertou 10 questões','target',50),
('first_essay','Primeira redação','Enviou sua primeira redação para correção','pen',50),
('streak_3','Constância','Estudou 3 dias seguidos','flame',80),
('first_plan','Planejado','Gerou seu primeiro plano de estudos','calendar',30);
