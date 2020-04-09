'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async find(ctx) {
        return await strapi.query("activitat").find({}, ['videos']);
    }, 
    async findOne(ctx) {
        //return ctx.req.params
        return await strapi.query("activitat").findOne({id:ctx.params.id}, ['videos']);
    }
};