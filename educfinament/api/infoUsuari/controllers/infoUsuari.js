'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const axios = require('axios');
/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async login(ctx) {
        return await axios.post('http://localhost:1337/auth/local', {
            identifier: ctx.request.body.user,
            password: ctx.request.body.pass,
        })
        .then(async response => {
            let centres = response.data.user.centres;
            centres = await strapi.query("centre").find({id_in:centres.map(x => x.id)}, [
                'nom','assignatures','assignatures.activitats','assignatures.alumnesProfessors','assignatures.activitats.videosAlumnes',
                'assignatures.alumnesProfessors.nom','assignatures.alumnesProfessors.cognoms','assignatures.alumnesProfessors.username'
            ]);

            let resposta = {
                jwt: response.data.jwt,
                usuari: response.data.user
            };

            resposta.usuari.centres = centres;

            return resposta;
        })
        .catch(error => {
            return error;
        });
    },

    async registre(ctx) {
        let rol;
        if(ctx.request.body.esProfessor) rol = await strapi.query('role', 'users-permissions').findOne({name:'Professor'},['name']);
        else rol = await strapi.query('role', 'users-permissions').findOne({name:'Alumne'},['name']);

        ctx.request.body.role = rol;

        return axios.post('http://localhost:1337/auth/local/register', ctx.request.body)
        .then(async response => {
          // Handle success.
          console.log('Well done!');
          console.log('User profile', response.data.user);
          console.log('User token', response.data.jwt);
          return await strapi.query('user', 'users-permissions').update({id: response.data.user.id}, {role: rol.id})
                .then(updatedUser => {
                    return updatedUser;
                }).catch(error => {
                    console.log('An error occurred:', error);
                });
        })
        .catch(error => {
          // Handle error.
          console.log('An error occurred:', error);
        });
    }
};
