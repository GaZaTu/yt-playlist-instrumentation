/**
 * @template T
 * @param {() => T | null | undefined | false | Promise<T | null | undefined | false>} check
 * @param {number} ms
 * @param {number} timeout
 * @returns {Promise<T>}
 */
const poll = (check, ms = 100, timeout = -1) =>
 new Promise((resolve, reject) => {
   const handler = async (i = 1) => {
     const r = await check()
     if (r) {
       return resolve(r)
     }

     if ((timeout > 0) && ((i * ms) >= timeout)) {
       return reject()
     }

     setTimeout(handler, ms, i + 1)
   }

   handler()
 })

module.exports = poll
