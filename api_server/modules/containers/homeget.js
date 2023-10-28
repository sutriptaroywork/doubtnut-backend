const _ = require('lodash')
const config = require('../../config/config')
const mysql = require("../mysql/homeget")
const redis = require("../redis/homeget")

module.exports = class Homeget {
  constructor() {
  }
	static async getNcertBrowseQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("ncert_questions",db.redis.read);
					console.log("data")
					console.log(data)
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getNcertBrowseQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"ncert_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getNcertBrowseQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getRDsharmaBrowseQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("rdsharma_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getRDsharmaBrowseQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"rdsharma_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getRDsharmaBrowseQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getCbseQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("cbse_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getCbseQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"cbse_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getCbseQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getCengageBrowseQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("cengage_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getCengageBrowseQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"cengage_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getCengageBrowseQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getTenthBoardsBrowseQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("tenthboard_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getTenthBoardsBrowseQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"tenthboard_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getTenthBoardsBrowseQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getBoardsBrowseQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("boards_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getBoardsBrowseQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"boards_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getBoardsBrowseQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getJeeMainsQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("jeemains_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getJeeMainsQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"jeemains_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getJeeMainsQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}


	static async getJeeAdvancedBrowseQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("jeeadvanced_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getJeeAdvancedBrowseQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"jeeadvanced_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getJeeAdvancedBrowseQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}


	static async getMostWatchedQuestions(db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("mostwatched_questions",db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getMostWatchedQuestions(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"mostwatched_questions",db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getMostWatchedQuestions(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getNcertBrowseQuestionsLocalisation(locale_val, version, db){
		let rediskey = "ncert_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getNcertBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getNcertBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getRDsharmaBrowseQuestionsLocalisation(locale_val, version, db){
		let rediskey = "rdsharma_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getRDsharmaBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getRDsharmaBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getCbseQuestionsLocalisation(version, db){
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter("cbse_questions_"+version,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getCbseQuestionsLocalisation(db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,"cbse_questions_"+version,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getCbseQuestionsLocalisation(db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getCengageBrowseQuestionsLocalisation(locale_val, version, db){
		let rediskey = "cengage_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getCengageBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getCengageBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getTenthBoardsBrowseQuestionsLocalisation(locale_val, version, db){
		let rediskey = "tenthboard_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getTenthBoardsBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getTenthBoardsBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getBoardsBrowseQuestionsLocalisation(locale_val, version, db){
		let rediskey = "boards_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getBoardsBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getBoardsBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getJeeMainsQuestionsLocalisation(locale_val, version, db){
		let rediskey = "jeemains_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getJeeMainsQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getJeeMainsQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}


	static async getJeeAdvancedBrowseQuestionsLocalisation(locale_val, version, db){
		let rediskey = "jeeadvanced_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getJeeAdvancedBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getJeeAdvancedBrowseQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getPhysicsQuestionsLocalisation(locale_val, version, db){
		let rediskey = "physics_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getPhysicsQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getPhysicsQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getChemistryQuestionsLocalisation(locale_val, version, db){
		let rediskey = "chemistry_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getChemistryQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getChemistryQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

	static async getBiologyQuestionsLocalisation(locale_val, version, db){
		let rediskey = "biology_questions_"+version;
		if(locale_val != "")
		{
			rediskey += "_"+locale_val
		}
		return new Promise(async (resolve,reject)=>{
			try
			{
				let data;
				if(config.caching)
				{
					data=await redis.getter(rediskey,db.redis.read);
					if (!_.isNull(data)) {
	            		return resolve(JSON.parse(data))
	          		}
	          		else
	          		{
	          			data = await mysql.getBiologyQuestionsLocalisation(locale_val, db.mysql.read)
	            		if (data.length > 0) {
	              			//set in redis
	              			await redis.setter(data,rediskey,db.redis.write)
	            		}
	            		return resolve(data)
	          		}
				}
				else
				{
					data = await mysql.getBiologyQuestionsLocalisation(locale_val, db.mysql.read)
	          		return resolve(data)
				}
			}
			catch(e)
			{
				reject(e);
			}
		});
	}

}
