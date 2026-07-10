-- =========================================================================
-- 0. LIMPIEZA TOTAL Y AGRESIVA DE VERSIONES ANTERIORES
-- =========================================================================
DROP TRIGGER IF EXISTS al_crear_usuario_en_auth ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.crear_perfil_nuevo_usuario() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.manejar_nuevo_usuario() CASCADE;

DROP POLICY IF EXISTS "Lectura publica instituciones" ON public.instituciones;
DROP POLICY IF EXISTS "Lectura publica carreras" ON public.carreras;
DROP POLICY IF EXISTS "Lectura publica sedes" ON public.sedes;
DROP POLICY IF EXISTS "Lectura publica vinculacion" ON public.carreras_sedes;
DROP POLICY IF EXISTS "Los usuarios solo ven su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Los usuarios solo modifican su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir insercion automatica de perfiles" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir a cada usuario insertar su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir insercion total de perfiles" ON public.usuarios;
DROP POLICY IF EXISTS "Solo admin gestiona carreras" ON public.carreras;
DROP POLICY IF EXISTS "Solo admin gestiona instituciones" ON public.instituciones;
DROP POLICY IF EXISTS "Solo admin gestiona sedes" ON public.sedes;
DROP POLICY IF EXISTS "Solo admin gestiona vinculacion" ON public.carreras_sedes;

DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.carreras_sedes CASCADE;
DROP TABLE IF EXISTS public.sedes CASCADE;
DROP TABLE IF EXISTS public.carreras CASCADE;
DROP TABLE IF EXISTS public.instituciones CASCADE;

-- =========================================================================
-- 1. CREACIÓN DE TABLAS DE INFRAESTRUCTURA Y CATÁLOGO
-- =========================================================================
CREATE TABLE public.instituciones (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

INSERT INTO public.instituciones (id, nombre) 
VALUES (1, 'Duoc UC')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.carreras (
    id SERIAL PRIMARY KEY,
    institucion_id INTEGER REFERENCES public.instituciones(id),
    nombre TEXT NOT NULL,
    url_duoc TEXT,
    descripcion TEXT,
    campo_laboral TEXT,
    area_conocimiento TEXT,
    duracion_semestre INTEGER,
    jornada TEXT,
    modalidad TEXT,
    arancel_anual INTEGER,
    matricula_referencial INTEGER,
    empleabilidad_1er_anio TEXT,
    empleabilidad_2do_anio TEXT,
    ingreso_promedio_4to_anio INTEGER,
    acreditacion TEXT,
    malla_pdf_url TEXT
);

CREATE TABLE public.sedes (
    id SERIAL PRIMARY KEY,
    institucion_id INTEGER REFERENCES public.instituciones(id),
    nombre TEXT NOT NULL,
    region TEXT,
    comuna TEXT,
    direccion TEXT,
    latitud FLOAT,
    longitud FLOAT
);

CREATE TABLE public.carreras_sedes (
    carrera_id INTEGER REFERENCES public.carreras(id) ON DELETE CASCADE,
    sede_id INTEGER REFERENCES public.sedes(id) ON DELETE CASCADE,
    cupos INTEGER,
    PRIMARY KEY (carrera_id, sede_id)
);

-- =========================================================================
-- 2. CREACIÓN DE LA TABLA DE USUARIOS
-- =========================================================================
CREATE TABLE public.usuarios (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombres TEXT NOT NULL,
     apellidos TEXT NOT NULL,
    fecha_nacimiento DATE,
    edad_registro INTEGER,
    genero TEXT,
    region TEXT,
    tipo_establecimiento TEXT,
    puntaje_paes TEXT,
    ranking_notas TEXT,
    tipo_usuario TEXT DEFAULT 'Estudiante',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 3. CONFIGURACIÓN DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- =========================================================================
ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carreras_sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Lectura Pública para todos
CREATE POLICY "Lectura publica instituciones" ON public.instituciones FOR SELECT USING (true);
CREATE POLICY "Lectura publica carreras" ON public.carreras FOR SELECT USING (true);
CREATE POLICY "Lectura publica sedes" ON public.sedes FOR SELECT USING (true);
CREATE POLICY "Lectura publica vinculacion" ON public.carreras_sedes FOR SELECT USING (true);

-- CAMBIO AQUÍ: El Administrador ahora puede gestionar TODO el catálogo
CREATE POLICY "Solo admin gestiona instituciones" ON public.instituciones FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND usuarios.tipo_usuario = 'Administrador'));

CREATE POLICY "Solo admin gestiona carreras" ON public.carreras FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND usuarios.tipo_usuario = 'Administrador'));

CREATE POLICY "Solo admin gestiona sedes" ON public.sedes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND usuarios.tipo_usuario = 'Administrador'));

CREATE POLICY "Solo admin gestiona vinculacion" ON public.carreras_sedes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.usuarios WHERE usuarios.id = auth.uid() AND usuarios.tipo_usuario = 'Administrador'));

-- Políticas de Perfil de Usuario
CREATE POLICY "Los usuarios solo ven su propio perfil" ON public.usuarios FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Los usuarios solo modifican su propio perfil" ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Permitir insercion total de perfiles" ON public.usuarios FOR INSERT WITH CHECK (true);

-- =========================================================================
-- 4. AUTOMATIZACIÓN DE REGISTROS (TRIGGER ORIGINAL PROTEGIDO)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
RETURNS TRIGGER AS $$
DECLARE
    rol_solicitado TEXT;
BEGIN
    rol_solicitado := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', COALESCE(NEW.raw_user_meta_data->>'tipoUsuario', 'Estudiante'));

    -- Protección contra registros maliciosos de administradores en el frontend
    IF rol_solicitado = 'Administrador' THEN
        rol_solicitado := 'Estudiante';
    END IF;

    INSERT INTO public.usuarios (
        id, nombres, apellidos, fecha_nacimiento, edad_registro, genero, region, tipo_establecimiento, puntaje_paes, ranking_notas, tipo_usuario
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombres', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'apellidos', 'Nuevo'),
        NULLIF(NEW.raw_user_meta_data->>'fecha_nacimiento', '')::DATE,
        NULLIF(COALESCE(NEW.raw_user_meta_data->>'edad_registro', '0'), '0')::INTEGER,
        COALESCE(NEW.raw_user_meta_data->>'genero', 'No especifica'),
        COALESCE(NEW.raw_user_meta_data->>'region', 'Metropolitana'),
        COALESCE(NEW.raw_user_meta_data->>'establecimiento', COALESCE(NEW.raw_user_meta_data->>'tipo_establecimiento', 'Municipal')),
        COALESCE(NEW.raw_user_meta_data->>'puntaje_paes', 'Seleccionar'),
        COALESCE(NEW.raw_user_meta_data->>'ranking_notas', 'Seleccionar'),
        rol_solicitado
    );
    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.usuarios (id, nombres, apellidos, tipo_usuario)
    VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1), 'Error Registro', 'Estudiante');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER al_crear_usuario_en_auth
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.crear_perfil_nuevo_usuario();

-- =========================================================================
-- 5. ASIGNACIÓN MANUAL DE ADMINISTRADOR (¡NUEVO BLOQUE!)
-- =========================================================================
-- NOTA: Regístrate primero desde tu formulario de React (se creará como Estudiante).
-- Una vez registrado, descomenta la línea de abajo, pon tu correo y dale a "Run".

-- UPDATE public.usuarios SET tipo_usuario = 'Administrador' WHERE id = (SELECT id FROM auth.users WHERE email = 'tu_correo_aqui@gmail.com');

-- =========================================================================
-- 6. BECAS Y BENEFICIOS EN GENERAL (NUEVO)
-- =========================================================================
-- 1. Asegurar que la tabla existe con la estructura correcta
CREATE TABLE IF NOT EXISTS beneficios (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    cobertura TEXT NOT NULL,
    requisitos TEXT NOT NULL,
    rsh_maximo INT NOT NULL,
    aplica_ip BOOLEAN NOT NULL DEFAULT TRUE,
    exige_paes BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. Limpiar registros viejos para que no se dupliquen
TRUNCATE TABLE beneficios;

-- 3. Insertar TODO el catálogo (Arancel, Mantención y Crédito / Copago)
INSERT INTO beneficios (nombre, tipo, categoria, cobertura, requisitos, rsh_maximo, aplica_ip, exige_paes)
VALUES 
(
    'Beca Nuevo Milenio', 
    'Estatal (MINEDUC)', 
    'Arancel', 
    'Financia desde $600.000 hasta $860.000 del arancel anual de la carrera.', 
    'Pertenecer al 70% más vulnerable según el Registro Social de Hogares (RSH). Contar con un promedio de notas de Enseñanza Media (NEM) igual o superior a 5.0.', 
    70, 
    TRUE, 
    FALSE
),
(
    'Beca Excelencia Técnica', 
    'Estatal (MINEDUC)', 
    'Arancel', 
    'Financia hasta $900.000 del arancel anual de la carrera.', 
    'Pertenecer al 70% más vulnerable según el RSH. Haber egresado de Enseñanza Media Técnico Profesional y encontrarse dentro del mejor 10% de rendimiento de su generación de egreso.', 
    70, 
    TRUE, 
    FALSE
),
(
    'Beca Juan Gómez Millas', 
    'Estatal (MINEDUC)', 
    'Arancel', 
    'Financia hasta $1.150.000 del arancel anual de la carrera.', 
    'Pertenecer al 70% más vulnerable según el RSH. Exige la rendición de la PAES y la obtención de un puntaje promedio mínimo de 485 puntos entre las pruebas obligatorias.', 
    70, 
    TRUE, 
    TRUE
),
(
    'Beca Excelencia Académica', 
    'Estatal (MINEDUC)', 
    'Arancel', 
    'Financia hasta $1.150.000 del arancel anual de la carrera.', 
    'Pertenecer al 100% del RSH. Destinado al 10% de los mejores egresados de establecimientos municipales, particulares subvencionados o de administración delegada de su generación.', 
    100, 
    TRUE, 
    FALSE
),
(
    'Beca para Hijos de Profesionales de la Educación', 
    'Estatal (MINEDUC)', 
    'Arancel', 
    'Financia hasta $500.000 del arancel anual de la carrera.', 
    'Pertenecer al 80% más vulnerable según el RSH. Ser hijo de profesionales o asistentes de la educación con contrato vigente en colegios municipales o particulares subvencionados. Promedio NEM mínimo de 5.5.', 
    80, 
    TRUE, 
    FALSE
),
(
    'Beca de Reparación (Valech - Traspaso)', 
    'Estatal (MINEDUC)', 
    'Arancel', 
    'Exención total del pago de matrícula y arancel por la duración formal de la carrera.', 
    'Ser hijo/a o nieto/a de una persona individualizada como víctima en los informes de las comisiones Rettig o Valech. No exige rendimiento académico ni tramo socioeconómico.', 
    100, 
    TRUE, 
    FALSE
),
(
    'Beca de Alimentación para la Educación Superior (BAES)', 
    'Estatal (JUNAEB)', 
    'Mantención', 
    'Asignación mensual cargada en tarjeta electrónica (Junaeb) para la compra de alimentos en comercios asociados.', 
    'Se otorga de manera automática a estudiantes que pertenezcan a los primeros 6 deciles (hasta el 60% RSH) y que cuenten con Gratuidad, créditos o becas de arancel.', 
    60, 
    TRUE, 
    FALSE
),
(
    'Crédito con Garantía Estatal (CAE)', 
    'Estatal (Comisión Ingresa)', 
    'Crédito / Copago', 
    'Financia desde $200.000 hasta el 100% del Arancel de Referencia fijado por el Ministerio, mediante un préstamo bancario garantizado por el Estado.', 
    'Pertenecer al 100% del RSH. Exige un promedio NEM mínimo de 5.2 para carreras técnicas en Institutos Profesionales (IP).', 
    100, 
    TRUE, 
    FALSE
);

-- Activa una política para que cualquiera pueda hacer SELECT (Lectura) de los beneficios
CREATE POLICY "Permitir lectura publica de beneficios" 
ON beneficios 
FOR SELECT 
USING (true);