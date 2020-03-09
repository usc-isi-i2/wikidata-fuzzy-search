export const log = {
  default: "background: ; color: ",
  highlight: "background: yellow; color: black",
  link: "background: white; color: blue"
}

export function truncateStr(str: string, maxLen: number) {
  /**
   * Truncate string by length.
   * 
   * @param {string}  str     Input string.
   * @param {int}     maxLen  Max length of output string.
   * 
   * @return {string} Output string.
   */

  if (str.length < maxLen) return str;
  else return str.substring(0, str.lastIndexOf(' ', maxLen)) + ' ...';
}

export function truncateQualifiers(arr: any, truncate = false) {
  /**
   * Truncate qualifiers and output string.
   * 
   * @param {string}  arr       Input qualifiers.
   * @param {bool}    truncate  Whether truncate or not.
   * 
   * @return {string} Output string.
   */

  if (truncate && arr.length > 3) {
    let str = '[';
    if (typeof arr[0] === "object") {
      // label
      str += String(arr[0].label);
      str += ', ' + String(arr[1].label);
      str += ', ' + String(arr[2].label);
    } else {
      // string
      str += String(arr[0]);
      str += ', ' + String(arr[1]);
      str += ', ' + String(arr[2]);
    }
    str += ', ...] (' + String(arr.length) + ' values)';
    return str;
  } else {
    let str = '[';
    if (typeof arr[0] === "object") {
      // label
      for (let i = 0; i < arr.length; i++) {
        if (i > 0) str += ', ';
        str += String(arr[i].label);
      }
    } else {
      // string
      for (let i = 0; i < arr.length; i++) {
        if (i > 0) str += ', ';
        str += String(arr[i]);
      }
    }
    str += ']';
    return str;
  }
}

export function formatTime(dateString: string, precision: number) {
  /**
   * Convert date string to date object, then format by given precision.
   * 
   * @param {string}  dateString e.g. '2017-01-01T00:00:00Z'
   * @param {int}     precision
   * 
   * @return {string}  formatted date string.
   */

  let formatted = '';
  const d = new Date(dateString);
  if (precision === null) precision = 11;

  // append year
  formatted += d.getUTCFullYear();
  if (precision <= 9) return formatted;

  // append month
  formatted += '-' + (d.getUTCMonth() + 1);
  if (precision === 10) return formatted;

  // append date
  formatted += '-' + d.getUTCDate();
  return formatted;
}

export function formatTimePrecision(precision: number) {
  /**
   * Convert time precision to string.
   * 
   * @param {int} precision
   * 
   * @return {string} formatted time precision.
   */

  // https://www.wikidata.org/wiki/Help:Dates#Precision
  const WIKIDATA_TIME_PRECISION: { [key: number]: string } = {
    14: 'second',
    13: 'minute',
    12: 'hour',
    11: 'day',
    10: 'month',
    9: 'year',
    8: 'decade',
    7: 'century',
    6: 'millennium',
    4: 'hundred thousand years',
    3: 'million years',
    0: 'billion years'
  }
  return WIKIDATA_TIME_PRECISION[precision];
}

export function shuffleArray(array: any[]) {
    // Shuffle an array in place
    // Code taken from here: https://stackoverflow.com/a/2450976/871910
    let currentIndex = array.length, temporaryValue: any, randomIndex: any;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
    
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    
    return array;
}

export function cartesianProduct<T>(a: T[], b: T[], ...c: T[][]): T[][] {
    // A wrapper around the originalCartesianProduct function from here
    // https://gist.github.com/ssippe/1f92625532eef28be6974f898efb23ef

    // The original function returns a T[] if only one array is passed. We
    // wrap it in a double array, so that the caller gets what it expects
    function originalCartesianProduct<T>(a: T[], b: T[], ...c: T[][]): T[] | T[][] {
        const f = <T>(a: T[], b: T[]) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
    
        if (!b || b.length===0)
            return a;
            
        const fab = f(a, b);
        const [b2, ...c2] = c;
        return originalCartesianProduct(fab, b2, c2);
    };

    const product = originalCartesianProduct(a, b, ...c);
    if(Array.isArray(product[0])) {
        return product as T[][];
    }

    const single = product as T[];
    return single.map(s => [s]);
}

export function cleanFieldName(fieldName: string): string {
    const noLabel = fieldName.endsWith('Label') ? fieldName.substr(0, fieldName.length - 5) : fieldName;
    const final = noLabel.replace(/_/g, ' ')

    return final;
}
