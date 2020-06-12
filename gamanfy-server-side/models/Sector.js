
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sectorSchema = new Schema({
sector:String

})




const Sector = mongoose.model("Sector", sectorSchema);

module.exports = Sector;

/* 
Tipos de sector

_01_Administración_gubernamental: String,
_02_Aeronáutica_aviación: String,
_03_Agricultura: String,
_04_Alimentación_y_bebidas: String,
_05_Almacenamiento: String,
_06_Arquitectura_y_planificación: String,
_07_Artes_escénicas: String,
_08_Artesanía: String,
_09_Artículos_de_consumo: String,
_10_Artículos_de_lujo_y_joyas: String,
_11_Artículos_deportivos: String,
_12_Atención_a_la_salud_mental: String,
_13_Atención_sanitaria_y_hospitalaria: String,
_14_Automación_industrial: String,
_15_Banca: String,
_16_Bellas_artes: String,
_17_Bienes_inmobiliarios: String,
_18_Biotecnología: String,
_19_Construcción: String,
_20_Consultoría: String,
_21_Contabilidad: String,
_22_Cosmética: String, 
_23_Deportes: String,
_24_Derecho: String,
_25_Desarrollo_de_programación: String,
_26_Diseño: String,
_27_Diseño_gráfico: String,
_28_Dotación_y_selección_de_personal: String,
_29_Educación_primaria_secundaria: String,
_30_Energía_renovable_y_medio_ambiente: String,
_31_Enseñanza_superior: String,
_32_Entretenimiento: String,
_33_Equipos_informáticos: String
 */