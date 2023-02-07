const pool = require("../config/database");

function cardFromDB(dbObj) {
    return new Card(dbObj.crd_id, dbObj.crd_name,
        dbObj.crd_img_url, dbObj.crd_lore, dbObj.crd_description,
        dbObj.crd_level, dbObj.crd_cost, dbObj.crd_timeout,
        dbObj.crd_max_usage, dbObj.crd_type);
}
class Card {
    constructor(id, name, url, lore, description, level,
        cost, timeout, maxUsage, type) {
        this.id = id;
        this.name = name;
        this.url = url;
        this.lore = lore;
        this.description = description;
        this.level = level;
        this.cost = cost;
        this.timeout = timeout;
        this.maxUsage = maxUsage;
        this.type = type;
    }



    static async getAll() {
        try {
            let result = [];
            let [dbCards, fields] = await pool.query("Select * from cards");
            for (let dbCard of dbCards) {
                result.push(cardFromDB(dbCard));
            }
            return { status: 200, result: result };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async getById(id) {
        try {
            let [dbCards, fields] =
                await pool.query("Select * from cards where crd_id=?", [id]);
            if (!dbCards.length)
                return { status: 404, result: { msg: "No card found with that identifier" } };
            let dbCard = dbCards[0];
            let result = cardFromDB(dbCard);
            return { status: 200, result: result };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async save(newCard) {
        try {
            let [dbCards, fields] =
                await pool.query("Select * from cards where crd_name=?", [newCard.name]);
            if (dbCards.length)
                return {
                    status: 400, result: [{
                        location: "body", param: "name",
                        msg: "That name already exists"
                    }]
                };
            let [result] =
                await pool.query(`Insert into cards (crd_name, crd_img_url, crd_lore, 
                crd_description, crd_level, crd_cost, crd_timeout, crd_max_usage, crd_type)
                values (?,?,?,?,?,?,?,?,?)`, [newCard.name, newCard.url, newCard.lore,
                newCard.description, newCard.level, newCard.cost, newCard.timeout,
                newCard.maxUsage, newCard.type]);
            return { status: 200, result: {msg:"Inserted a new card", id: result.insertId}} ;
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async filterByType(typeId) {
        try {
            let result = [];
            let [dbCards, fields] =
                await pool.query("Select * from cards where crd_type=?", [typeId]);
            for (let dbCard of dbCards) {
                result.push(cardFromDB(dbCard));
            }
            return { status: 200, result: result };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async filterByLoreOrDescription(text) {
        try {
            let result = [];
            let [dbCards] =
                await pool.query(`Select * from cards 
                where crd_description LIKE ? or crd_lore LIKE ?`,
                    ['%' + text + '%', '%' + text + '%']);
            for (let dbCard of dbCards) {
                result.push(cardFromDB(dbCard));
            }
            return { status: 200, result: result };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }



    static async edit(newInfo) {
        try {
            // Checking if card exist to edit the card
            let [dbCards] =
                await pool.query("Select * from cards where crd_id=?",
                    [newInfo.id]);
            if (dbCards.length == 0) {
                return {
                    status: 404, result: {
                        msg: "No card found with that ID"
                    }
                };
            };

            // Checking if the new name does not exist (excludes the card
            // we are editing since we might not want to change the name )
            [dbCards] =
                await pool.query("Select * from cards where crd_name=? and crd_id!=?",
                    [newInfo.name, newInfo.id]);
            if (dbCards.length)
                return {
                    status: 400, result: [{
                        location: "body", param: "name",
                        msg: "Another card already has that name"
                    }]
                };
            // We are considering all values will be changing
            let [result] =
                await pool.query(`update cards 
                set crd_name=?, crd_img_url=?, crd_lore=?, 
                crd_description=?, crd_level=?, crd_cost=?, crd_timeout=?, 
                crd_max_usage=?, crd_type=? where crd_id=?`, [newInfo.name, newInfo.url, newInfo.lore,
                newInfo.description, newInfo.level, newInfo.cost, newInfo.timeout,
                newInfo.maxUsage, newInfo.type, newInfo.id]);
            return { status: 200, result:{msg:"Card edited" }}
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async deleteById(id) {
        try {
            let [result] =
                await pool.query("delete from cards where crd_id=?", [id]);
            // if nothing was deleted it means no card exists with that id
            if (!result.affectedRows)
                return { status: 404, result: { msg: "No card found with that identifier" } };
            return { status: 200, result: {msg: "Card deleted!"} };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }



}

module.exports = Card;