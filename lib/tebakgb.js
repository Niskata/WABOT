const appRoot = require('app-root-path')
const low = require('lowdb')
const axios = require('axios')
const FileSync = require('lowdb/adapters/FileSync')
const db_tgb = new FileSync(appRoot + '/data/tebakgb.json')
const db = low(db_tgb)
db.defaults({ group: [] }).write()

/**
 * Get Tebak Gambar object from api and store ans match groupId.
 * @param {String} groupId 
 * @returns {Promise} <TebakGambar> object
 */
const getTebakGambar = (groupId) => new Promise((resolve) => {
	try {
		axios.get(`https://nishikata-api.herokuapp.com/api/kuis/tebakgambar?apikey=MansKey`).then((res) => {
			ans = res.data.jawaban
			const find = db.get('group').find({ id: groupId }).value()
			if (find && find.id === groupId) {
				db.get('group').find({ id: groupId }).set('ans', ans).write()
				resolve(res.data)
			} else {
				db.get('group').push({ id: groupId, ans: ans }).write()
				resolve(res.data)
			}
		}).catch((err) => {
			console.error(err.message)
		})
	} catch (err) { console.error(err.message) }
})

/**
 * Get Ans of Tebak Gambar from database match groupId.
 * @param {String} groupId 
 * @returns {Promise} <Ans> object | Boolean
 */
const getAns = (groupId) => new Promise((resolve) => {
	try {
		const find = db.get('group').find({ id: groupId }).value()
		if (find && find.id === groupId) {
			const ans = db.get('group').find({ id: groupId }).value()
			resolve(ans)
		} else {
			resolve(false)
		}
	} catch (err) { console.error(err.message) }
})

/**
 * Delete data from database match groupId.
 * @param {String} groupId 
 * @returns {Promise} Boolean
 */
const delData = (groupId) => new Promise((resolve) => {
	try {
		const res = db.get('group').remove({ id: groupId }).write()
		if (res.length === 0) resolve(false)
		else resolve(true)
	} catch (err) { console.error(err.message) }
})

// BY SEROBOT -> https://github.com/dngda/bot-whatsapp

module.exports = {
	getTebakGambar,
	getAns,
	delData
}