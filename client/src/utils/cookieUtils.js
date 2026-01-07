/**
 * Set a cookie with a specific name, value, and expiration time in hours.
 * @param {string} name - Name of the cookie
 * @param {string} value - Value of the cookie
 * @param {number} hours - Expiration time in hours
 */
export const setCookie = (name, value, hours) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/**
 * Get the value of a cookie by its name.
 * @param {string} name - Name of the cookie
 * @returns {string|null} - Value of the cookie or null if not found
 */
export const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

/**
 * Delete a cookie by its name.
 * @param {string} name - Name of the cookie
 */
export const eraseCookie = (name) => {
  document.cookie = name + '=; Max-Age=-99999999;path=/;';
};
