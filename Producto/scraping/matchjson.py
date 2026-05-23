import json
import os
from typing import Dict, Optional, List, Tuple

# ============================================================================
# CONFIGURACIÓN DE RUTAS
# ============================================================================
def encontrar_archivo(nombre_archivo: str) -> Optional[str]:
    """Busca un archivo en múltiples ubicaciones posibles"""
    rutas_posibles = [
        nombre_archivo,
        os.path.join("src", nombre_archivo),
        os.path.join(os.getcwd(), nombre_archivo),
        os.path.join(os.getcwd(), "src", nombre_archivo),
    ]
    
    for ruta in rutas_posibles:
        if os.path.exists(ruta):
            return ruta
    return None

# ============================================================================
# MAPEO COMPLETO DE CARRERAS (El "Traductor")
# ============================================================================
MAPEO_CARRERAS = {
    # Administración y Negocios
    "Administración de Empresas": "Técnico en Administración y Administración de Empresas",
    "Administración en Turismo y Hospitalidad Mención Administración Hotelera": "Turismo y Hotelería, Ecoturismo y Tourism and Hospitality",
    "Administración en Turismo y Hospitalidad Mención Gestión para el Ecoturismo": "Turismo Técnico, Turismo de Aventura, Administración Hotelera y Tourism & Hospitality Technician",
    "Administración en Turismo y Hospitalidad Mención Gestión de Destinos Turísticos": "Turismo Técnico, Turismo de Aventura, Administración Hotelera y Tourism & Hospitality Technician",
    "Administración en Turismo y Hospitalidad Mención Hospitality Management": "Turismo Técnico, Turismo de Aventura, Administración Hotelera y Tourism & Hospitality Technician",
    "Administración Pública": "Administración Pública", # <-- Agregada por si acaso
    
    # Tecnología y Programación
    "Analista Programador": "Técnico Analista Programador Computacional y Administración en Infraestrcutura y Plataformas Tecnológicas",
    "Analista Programador Computacional": "Técnico Analista Programador Computacional y Administración en Infraestrcutura y Plataformas Tecnológicas",
    "Desarrollo de Aplicaciones": "Técnico Analista Programador Computacional y Administración en Infraestrcutura y Plataformas Tecnológicas",
    "Desarrollo y Diseño Web": "Técnico Analista Programador Computacional y Administración en Infraestrcutura y Plataformas Tecnológicas",
    
    # Diseño y Animación
    "Animación Digital": "Animación Digital",
    "Diseño de Ambientes": "Diseño de Ambientes",
    "Diseño de Vestuario": "Diseño de Vestuario",
    "Diseño Gráfico": "Diseño Gráfico",
    "Diseño Industrial e Innovación en Productos": "Diseño Industrial",
    
    # Comunicación y Audiovisual
    "Comunicación Audiovisual": "Comunicación Audiovisual",
    "Publicidad": "Publicidad",
    "Relaciones Públicas y Comunicación Organizacional": "Relaciones Públicas",
    "Técnico Audiovisual": "Técnico Audiovisual",
    "Tecnología en Sonido e Iluminación": "Tecnología en Sonido",
    "Ingeniería en Sonido": "Ingeniería en Sonido",
    
    # Auditoría y Contabilidad
    "Auditoría": "Auditoría",
    "Auditoría y Análisis de Negocios": "Auditoría",
    "Contabilidad General Mención Legislación Tributaria": "Técnico en Contabilidad General",
    "Contabilidad Tributaria": "Contabilidad",
    "Audit-NuevaTest": "Auditoría", 
    
    # Comercio y Logística
    "Comercio Exterior": "Técnico en Comercio Exterior",
    "Ingeniería en Comercio Exterior": "Ingeniería en Comercio Exterior",
    "Ingeniería en Gestión Logística": "Ingeniería en Gestión Logística",
    "Técnico en Gestión Logística": "Técnico en Gestión Logística",
    "Técnico en Operaciones Logísticas": "Técnico en Gestión Logística",
    
    # Gastronomía
    "Gastronomía": "Técnico en Gastronomía",
    "Gastronomía Internacional": "Gastronomía Internacional",
    
    # Ingenierías
    "Informática Biomédica": "Ingeniería en Informática, en Infraestructura y Plataformas Tecnológicas",
    "Ingeniería Agrícola": "Ingeniería Agrícola",
    "Ingeniería en Administración Mención Finanzas": "Ingeniería en Administración mención Finanzas",
    "Ingeniería en Administración Mención Gestión de Personas": "Ingeniería en Administración de Recursos Humanos y Gestión de Personas",
    "Ingeniería en Administración Mención Innovación y Emprendimiento": "Ingeniería en Administración",
    "Ingeniería en Automatización y Control Industrial": "Ingeniería en Electricidad y Automatización Industrial, y Electrónica",
    "Ingenieria en Ciberseguridad": "Ingeniería en Informática, en Infraestructura y Plataformas Tecnológicas",
    "Ingeniería en Ciencia de Datos": "Ingeniería en Informática, en Infraestructura y Plataformas Tecnológicas",
    "Ingeniería en Construcción": "Ingeniería en Construcción",
    "Ingeniería en Desarrollo de Software": "Ingeniería en Informática, en Infraestructura y Plataformas Tecnológicas",
    "Ingeniería en Electricidad y Automatización Industrial": "Ingeniería en Electricidad y Automatización Industrial, y Electrónica",
    "Ingeniería en Gestión de Personas": "Ingeniería en Administración de Recursos Humanos y Gestión de Personas",
    "Ingeniería en Informática": "Ingeniería en Informática, en Infraestructura y Plataformas Tecnológicas",
    "Ingeniería en Infraestructura Tecnológica": "Ingeniería en Informática, en Infraestructura y Plataformas Tecnológicas",
    "Ingeniería en Maquinaria y Vehículos Pesados": "Ingeniería en Mecánica Automotriz y Autotrónica, e Ingeniería en Maquinarias y Vehículos Pesados",
    "Ingeniería en Marketing Digital": "Ingeniería en Marketing y Administración mención Marketing",
    "Ingeniería en Mecánica Automotriz y Autotrónica": "Ingeniería en Mecánica Automotriz y Autotrónica, e Ingeniería en Maquinarias y Vehículos Pesados",
    "Ingeniería en Medio Ambiente": "Ingeniería en Medio Ambiente",
    "Ingeniería en Prevención de Riesgos": "Ingeniería en Prevención de Riesgos",
    "Ingeniería en Redes y Telecomunicaciones": "Ingeniería en Conectividad y Redes",
    
    # Dibujo y Construcción
    "Dibujo y Modelamiento Arquitectónico y Estructural": "Dibujo Arquitectónico y Estructural, y Modelamiento Arquitectónico y Estructural",
    "Restauración de Bienes Patrimoniales": "Técnico en Construcción",
    "Técnico en Construcción": "Técnico en Construcción",
    
    # Técnicos de Salud
    "Técnico en Laboratorio Clínico y Banco de Sangre": "Técnico de Laboratorio Clínico y Banco de Sangre",
    "Técnico en Radiodiagnóstico y Radioterapia": "Técnico de Radiodiagnóstico y Radioterapia",
    "Técnico en Enfermería": "Técnico en Enfermería",
    "Técnico en Odontología": "Técnico en Odontología",
    "Técnico en Química y Farmacia": "Técnico en Química y Farmacia",
    
    # Técnicos Industriales
    "Técnico Agrícola": "Técnico Agrícola",
    "Técnico en Calidad de Alimentos": "Técnico en Calidad de Alimentos",
    "Técnico en Electricidad y Automatización Industrial": "Técnico en Electricidad y Automatización Industrial, en Instalaciones y Proyectos Eléctricos",
    "Técnico en Electricidad y Energías Renovables": "Técnico en Energías Renovables y Eficiencia Energética",
    "Técnico en Geología": "Técnico en Geología y Control en Sondaje",
    "Técnico en Mantenimiento Industrial": "Técnico en Mantenimiento Electromecánico",
    "Técnico en Maquinaria y Vehículos Pesados": "Técnico en Maquinaria y Vehículos Pesados",
    "Técnico en Mecánica Automotriz y Autotrónica": "Técnico en Mecánica Automotriz y Autotrónica",
    
    # Prevención de Riesgos
    "Técnico en Prevención de Riesgos": "Técnico en Prevención de Riesgos",
    "Técnico en Prevención de Riesgos Laborales": "Técnico en Prevención de Riesgos",
    
    # Turismo y Hotelería
    "Técnico en Turismo y Hospitalidad": "Turismo Técnico, Turismo de Aventura, Administración Hotelera y Tourism & Hospitality Technician",
    
    # Otros
    "Preparador Físico": "Preparador Físico",
    "Técnico en Administración": "Técnico en Administración y Administración de Empresas",
    "Técnico de Redes y Telecomunicaciones": "Técnico en Telecomunicaciones y Administración de Redes",
    "Técnico Topógrafo Geomático": "Técnico en Topografía",
    "Técnico Veterinario y Pecuario": "Técnico Veterinario y Pecuario"
}

def construir_indice_empleabilidad(lista_carreras_mifuturo: List[Dict]) -> Dict:
    """Construye un índice de búsqueda rápida por el nombre oficial de MiFuturo"""
    indice = {}
    
    for item in lista_carreras_mifuturo:
        carrera = item.get('carrera', '')
        if not carrera:
            continue
        
        info_empleabilidad = {
            'porcentaje_titulados_continuidad': item.get('porcentaje_titulados_continuidad'),
            'retencion_primer_ano': item.get('retencion_primer_ano'),
            'duracion_real_semestres': item.get('duracion_real_semestres'),
            'empleabilidad_primer_ano': item.get('empleabilidad_primer_ano'),
            'empleabilidad_segundo_ano': item.get('empleabilidad_segundo_ano'),
            'ingreso_promedio_cuarto_ano': item.get('ingreso_promedio_cuarto_ano')
        }
        indice[carrera] = info_empleabilidad
    
    return indice

def procesar_json(primer_json_path: str, segundo_json_path: str, mapeo: Dict):
    """Procesa ambos archivos JSON y realiza el match"""
    
    # Leer el archivo de DUOC (Las 80 carreras base)
    with open(primer_json_path, 'r', encoding='utf-8') as f:
        datos_duoc = json.load(f)
    
    # Leer el archivo de MIFUTURO (El que tiene el metadata)
    with open(segundo_json_path, 'r', encoding='utf-8') as f:
        datos_mifuturo_bruto = json.load(f)
    
    # ¡AQUÍ ESTÁ LA MAGIA! Extraemos solo la lista de carreras y evitamos la 'metadata'
    if isinstance(datos_mifuturo_bruto, dict) and "carreras" in datos_mifuturo_bruto:
        lista_mifuturo = datos_mifuturo_bruto["carreras"]
    elif isinstance(datos_mifuturo_bruto, list):
        lista_mifuturo = datos_mifuturo_bruto
    else:
        lista_mifuturo = []

    # Construir índice de búsqueda
    indice_empleabilidad = construir_indice_empleabilidad(lista_mifuturo)
    
    # Estadísticas
    stats = {
        'total': len(datos_duoc),
        'match': 0,
        'sin_match': 0,
        'sin_match_lista': []
    }
    
    # Procesar cada carrera de Duoc
    for item in datos_duoc:
        carrera_duoc = item.get('nombre_carrera', '')
        
        # 1. Verificar si la carrera de Duoc existe en el diccionario
        if not carrera_duoc or carrera_duoc not in mapeo:
            item['empleabilidad'] = None
            stats['sin_match'] += 1
            if carrera_duoc:
                stats['sin_match_lista'].append(f"{carrera_duoc} (No está en el diccionario MAPEO)")
            continue
        
        carrera_destino = mapeo[carrera_duoc]
        
        # 2. Verificar si el nombre oficial existe en los datos scrapeados de MiFuturo
        if carrera_destino in indice_empleabilidad:
            item['empleabilidad'] = indice_empleabilidad[carrera_destino]
            item['empleabilidad_match_info'] = {
                'carrera_match': carrera_destino,
                'tipo_match': 'mapeo_config'
            }
            stats['match'] += 1
            print(f"✓ '{carrera_duoc}' → UNIDO EXITOSAMENTE")
        else:
            item['empleabilidad'] = None
            stats['sin_match'] += 1
            stats['sin_match_lista'].append(f"{carrera_duoc} (El traductor dijo '{carrera_destino}', pero no se extrajo de MiFuturo)")
            print(f"✗ '{carrera_duoc}' → SIN DATOS EN MIFUTURO")
    
    return datos_duoc, stats

def main():
    # Asegúrate de que los archivos se llamen exactamente así en tu carpeta
    ruta_primero = encontrar_archivo("datos.json")
    ruta_segundo = encontrar_archivo("empleabilidad_duoc_completo.json")
    
    if not ruta_primero:
        print("No se encontró 'datos.json'. Por favor ponlo en la carpeta.")
        return
    if not ruta_segundo:
        print("No se encontró 'empleabilidad_duoc_completo.json'. Por favor ponlo en la carpeta.")
        return
    
    print("=" * 60)
    print("PROCESAMIENTO DE CARRERAS CON EMPLEABILIDAD")
    print("=" * 60)
    
    # Procesar y cruzar datos
    resultado, stats = procesar_json(ruta_primero, ruta_segundo, MAPEO_CARRERAS)
    
    # Guardar archivo final
    with open("datos_con_empleabilidad.json", "w", encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
    
    # Imprimir resumen bonito
    print("\n" + "=" * 60)
    print("ESTADÍSTICAS DE PROCESAMIENTO")
    print("=" * 60)
    print(f"Total de carreras de DUOC procesadas: {stats['total']}")
    print(f"Match exitosos: {stats['match']}")
    print(f"Sin match: {stats['sin_match']}")
    
    if stats['total'] > 0:
        porcentaje = (stats['match'] / stats['total'] * 100)
        print(f"\nTasa de éxito: {porcentaje:.1f}%")
    
    if stats['sin_match_lista']:
        print("\nCarreras que quedaron sin datos de empleabilidad:")
        for carrera in stats['sin_match_lista']:
            print(f"   - {carrera}")
    
    print(f"\n¡Listo! Tu archivo final es: datos_con_empleabilidad.json")

if __name__ == "__main__":
    main()