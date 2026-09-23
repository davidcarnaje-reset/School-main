import ph from 'phil-reg-prov-mun-brgy';

/**
 * Philippine Standard Geographic Code (PSGC) Address Service
 * Provides helper functions to fetch Provinces, Cities/Municipalities, and Barangays.
 */

// Helper to convert ALL CAPS to Title Case for cleaner UI display
const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-|\/)\S/g, (m) => m.toUpperCase());
};

/**
 * Get sorted list of all provinces
 * @returns {Array<{name: string, rawName: string, code: string}>}
 */
export const getProvinces = () => {
  try {
    return ph.provinces
      .map(p => ({
        name: toTitleCase(p.name),
        rawName: p.name,
        code: p.prov_code
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error fetching provinces:', err);
    return [];
  }
};

/**
 * Get cities/municipalities for a given province name or code
 * @param {string} provinceNameOrCode 
 * @returns {Array<{name: string, rawName: string, code: string}>}
 */
export const getCitiesByProvince = (provinceNameOrCode) => {
  if (!provinceNameOrCode) return [];
  try {
    const cleanSearch = provinceNameOrCode.trim().toLowerCase();
    const province = ph.provinces.find(
      p => p.prov_code === provinceNameOrCode || p.name.toLowerCase() === cleanSearch || toTitleCase(p.name).toLowerCase() === cleanSearch
    );

    if (!province) return [];

    const cities = ph.getCityMunByProvince(province.prov_code) || [];
    return cities
      .map(c => ({
        name: toTitleCase(c.name),
        rawName: c.name,
        code: c.mun_code
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error fetching cities:', err);
    return [];
  }
};

/**
 * Get barangays for a given city name/code and optional province name/code
 * @param {string} cityNameOrCode 
 * @param {string} [provinceNameOrCode] 
 * @returns {Array<{name: string, rawName: string, code: string}>}
 */
export const getBarangaysByCity = (cityNameOrCode, provinceNameOrCode = '') => {
  if (!cityNameOrCode) return [];
  try {
    let targetMunCode = '';

    if (/^\d+$/.test(cityNameOrCode)) {
      targetMunCode = cityNameOrCode;
    } else {
      let citiesToSearch = [];
      if (provinceNameOrCode) {
        citiesToSearch = getCitiesByProvince(provinceNameOrCode);
      } else {
        citiesToSearch = (ph.city_mun || []).map(c => ({
          name: toTitleCase(c.name),
          rawName: c.name,
          code: c.mun_code
        }));
      }

      const cleanCitySearch = cityNameOrCode.trim().toLowerCase();
      const matchedCity = citiesToSearch.find(
        c => c.name.toLowerCase() === cleanCitySearch || c.rawName.toLowerCase() === cleanCitySearch
      );

      if (matchedCity) {
        targetMunCode = matchedCity.code;
      }
    }

    if (!targetMunCode) return [];

    const barangays = ph.getBarangayByMun(targetMunCode) || [];
    return barangays
      .map(b => ({
        name: toTitleCase(b.name),
        rawName: b.name,
        code: b.code || b.mun_code
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('Error fetching barangays:', err);
    return [];
  }
};

export default {
  getProvinces,
  getCitiesByProvince,
  getBarangaysByCity
};
