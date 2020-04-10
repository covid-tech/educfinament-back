'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {    
    async find(ctx) {
        return await strapi.query("organitzacio").find({}, ['grups','alumnes','professors']);
    }, 
    async findOne(ctx) {
        return await strapi.query("organitzacio").findOne({id:ctx.params.id}, ['grups','alumnes','professors']);
    }

};
