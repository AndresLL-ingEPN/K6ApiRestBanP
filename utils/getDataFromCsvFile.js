import exec from 'k6/execution';
import { SharedArray } from 'k6/data';
import papaparse from '../libs/papaparse/5.1.1/index.js';
import { randomIntBetween } from '../libs/k6-utils/1.4.0/index.js';

/**
 * Lee un archivo CSV y lo almacena en un SharedArray para su uso en pruebas con k6.
 * 
 * @param {string} sharedArrayName - Nombre del SharedArray donde se almacenarán los datos.
 * @param {string} filePath - Ruta del archivo CSV a leer.
 * @returns {SharedArray} Un SharedArray con los datos del CSV o un array vacío en caso de error.
 * 
 * @throws {Error} Si el archivo no se puede abrir, está vacío o no contiene datos válidos.
 * 
 * @example
 * const users = readCsvFile('UsersData', 'data/users.csv');
 * console.log(`Usuarios cargados: ${users.length}`);
 */
export function readCsvFile(sharedArrayName, filePath) {
  try {
    const fileContent = open(filePath);

    if (!fileContent) {
      throw new Error(`El archivo CSV en la ruta '${filePath}' está vacío o no se pudo abrir.`);
    }

    // Parsear el contenido con papaparse (opciones: https://www.papaparse.com/docs#config)
    const parsedData = papaparse.parse(fileContent, {
      header: true,
    }).data;

    // Validar dato y que no esté vacío
    if (!parsedData || parsedData.length === 0) {
      throw new Error(`El archivo CSV '${filePath}' no contiene datos válidos.`);
    }

    // Retornar el SharedArray con los datos procesados
    return new SharedArray(sharedArrayName, function () {
      return parsedData;
    });
  } catch (error) {
    console.error(`Error al leer el archivo CSV: ${error.message}`);
    return new SharedArray(sharedArrayName, () => []); // Retorna un array vacío para evitar fallos
  }
}

/**
 * Obtiene un dato aleatorio de un array.
 *
 * @param {Array} csvRead - El array de datos del cual se obtendrá un dato aleatorio.
 * @returns {*} - Un dato aleatorio del array 'csvRead'.
 *
 * @example
 * // Supongamos que csvRead es ['dato1', 'dato2', 'dato3']
 * // La función puede devolver 'dato1', 'dato2' o 'dato3' aleatoriamente
 *
 * getRandomData(['dato1', 'dato2', 'dato3']);
 *
 */
export function getRandomData(csvRead) {
  const index = Math.floor(Math.random() * csvRead.length);
  return csvRead[index];
}

/**
 * Obtiene los mismos datos de un archivo CSV para cada usuario virtual (VU).
 *
 * @param {Array} csvRead - Un array que contiene los datos leídos desde un archivo CSV.
 * @returns {*} El dato correspondiente al usuario virtual en ejecución.
 *
 * @example
 * // Suponiendo que csvRead es un array con datos de usuarios
 * const userData = getSameDataByUser(csvRead);
 * console.log(userData);
 *
 * @note Esta función asigna datos de forma que cada VU siempre reciba la misma fila
 * del CSV en función de su ID dentro de la prueba.
 *
 */
export function getSameDataByUser(csvRead) {
  const index = exec.vu.idInTest - 1;
  return csvRead[index];
}

/**
 * Obtiene datos secuenciales de un array basado en el ID de usuario virtual (VU) y la iteración actual.
 *
 * @param {Array} csvRead - El array de datos del cual se obtendrán los datos secuenciales.
 * @returns {*} - El dato correspondiente al índice calculado en el array 'csvRead', o un mensaje de error si el índice excede la longitud del array.
 *
 * @example
 * // Se debe especificar el valor __ENV.MAX_VUS desde la consola al ejecutar el comando k6
 * // Ejemplo de uso con el comando k6, note que MAX_VUS y --vus deben tener el mismo valor e iterations debe ser múltiplo de ambos
 *
 * k6 run -e MAX_VUS=4 --vus 4 --iterations 100 script.js
 *
 * @example
 * // Supongamos que __ENV.MAX_VUS es 10, exec.vu.idInTest es 2, y exec.vu.iterationInInstance es 3
 * // El índice calculado sería 2 + 3 * 10 - 1 = 31
 * // Si csvRead[31] es 'dato', la función devolverá 'dato'
 *
 * getSecuencialData(csvRead);
 *
 * @note Se recomienda que el archivo CSV de entrada contenga suficientes datos para cubrir todas las peticiones, ya que se generará un error si se alcanza el final del archivo antes de completar todas las iteraciones.
 */
export function getSecuencialData(csvRead) {
  const vu = exec.vu.idInTest;
  const iter = exec.vu.iterationInInstance;

  const index = vu + iter * __ENV.MAX_VUS - 1;

  if (index >= csvRead.length) {
    throw new Error(
      'El índice calculado excede la longitud del arreglo. Asegúrese de que el archivo CSV tenga suficientes datos.'
    );
  }

  return csvRead[index];
}

/**
 * Devuelve un elemento del array `csvRead` basado en el índice actual de la iteración del escenario.
 *
 * @param {Array} csvRead - El array que contiene los datos leídos del archivo CSV.
 * @returns {*} El elemento del array `csvRead` correspondiente al índice actual de la iteración.
 * @throws {Error} Si el índice calculado excede la longitud del array `csvRead`.
 *
 * @example
 * // Supongamos que exec.scenario.iterationInTest es 2 y csvRead es ['a', 'b', 'c', 'd']
 * const result = getDataInOrder(['a', 'b', 'c', 'd']);
 * console.log(result); // 'c'
 * @note Se recomienda que el archivo CSV de entrada contenga suficientes datos para cubrir todas las peticiones, ya que se generará un error si se alcanza el final del archivo antes de completar todas las iteraciones.
 */
export function getDataInOrder(csvRead) {
  const index = exec.scenario.iterationInTest;

  if (index >= csvRead.length) {
    throw new Error(
      'El índice calculado excede la longitud del array. Asegúrese de que el archivo CSV tenga suficientes datos.'
    );
  }

  return csvRead[index];
}

/**
 * Obtiene un dato aleatorio dentro del bloque correspondiente al usuario virtual actual.
 *
 * @param {Array} csvRead - Un array que contiene los datos leídos de un archivo CSV.
 * @param {number} blockLong - La cantidad de registros por bloque.
 * @returns {Object} - Un objeto que contiene los datos correspondientes al índice calculado y el índice mismo.
 * @throws {RangeError} - Si el índice calculado está fuera de los límites del array.
 */
export function getRandomDataByBlock(csvRead, blockLong) {
    const index = (exec.vu.idInTest - 1) * blockLong + randomIntBetween(0, blockLong - 1);

    // Validar que el índice esté dentro de los límites del array
    if (index < 0 || index >= csvRead.length) {
        throw new RangeError(`Índice fuera de rango: ${index}. El tamaño del CSV es ${csvRead.length}.`);
    }

    return {
        data: csvRead[index],
        index: index
    };
}

/**
 * Obtiene datos secuenciales dentro del bloque correspondiente al usuario virtual actual.
 *
 * @param {Array} csvRead - Un array que contiene los datos leídos de un archivo CSV.
 * @param {number} blockLong - La cantidad de registros por bloque.
 * @returns {Object} - Un objeto que contiene los datos correspondientes al índice calculado y el índice mismo.
 * @throws {RangeError} - Si el índice calculado está fuera de los límites del array.
 */
export function getSequentialDataByBlock(csvRead, blockLong) {
    const index = (exec.vu.idInTest - 1) * blockLong + (exec.vu.iterationInInstance % blockLong);

    // Validar que el índice esté dentro de los límites del array
    if (index < 0 || index >= csvRead.length) {
        throw new RangeError(`Índice fuera de rango: ${index}. El tamaño del CSV es ${csvRead.length}.`);
    }

    return {
        data: csvRead[index],
        index: index
    };
}