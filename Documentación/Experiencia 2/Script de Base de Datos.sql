-- 1. Crear tabla instituciones
CREATE TABLE instituciones (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

-- Insertar Duoc UC (Para que el ID 1 exista, ya que tu script usa INSTITUCION_ID = 1)
INSERT INTO instituciones (id, nombre) VALUES (1, 'Duoc UC');

-- 2. Crear tabla carreras
CREATE TABLE carreras (
    id SERIAL PRIMARY KEY,
    institucion_id INTEGER REFERENCES instituciones(id),
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
    acreditacion TEXT
);

-- 3. Crear tabla sedes
CREATE TABLE sedes (
    id SERIAL PRIMARY KEY,
    institucion_id INTEGER REFERENCES instituciones(id),
    nombre TEXT NOT NULL,
    region TEXT,
    comuna TEXT,
    direccion TEXT,
    latitud FLOAT,
    longitud FLOAT
);

-- 4. Crear tabla intermedia (relación muchos a muchos)
CREATE TABLE carreras_sedes (
    carrera_id INTEGER REFERENCES carreras(id) ON DELETE CASCADE,
    sede_id INTEGER REFERENCES sedes(id) ON DELETE CASCADE,
    cupos INTEGER,
    PRIMARY KEY (carrera_id, sede_id)
);
ALTER TABLE carreras ADD COLUMN malla_pdf_url TEXT;