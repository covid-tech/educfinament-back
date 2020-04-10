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
            delete response.data.user.organitzacions;
            return response.data;
        })
        .catch(error => {
            return error;
        });
    },

    async registre(ctx) {
        let rol = await strapi.query('role', 'users-permissions').findOne({name:'Participant'},['name']);

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
    },

    async obtenirArbre(ctx) {
        return await strapi.query('user', 'users-permissions').findOne({id: ctx.params.id}, ["organitzacions", "imatgePerfil"])
        .then(async user => {
            for(let i=0; i<user.organitzacions.length; i++) {
                user.organitzacions[i].grups = await strapi.services.grup.find({'professors.id': user.id},[
                    "id","nom","activitats","alumnes","professors","alumnes.imatgePerfil","professors.imatgePerfil"
                ]);

                user.organitzacions[i].grups = user.organitzacions[i].grups.concat(
                    await strapi.services.grup.find({'alumnes.id': user.id},[
                        "id","nom","activitats","alumnes","professors","alumnes.imatgePerfil","professors.imatgePerfil"
                    ])
                );

                for(let k=0; k<user.organitzacions[i].grups.length;k++) {
                    user.organitzacions[i].grups[k].activitats = await strapi.services.activitat.find({'professors.id': user.id},[
                        "id","nom","alumnes","professors","alumnes","professors","alumnes.imatgePerfil","professors.imatgePerfil"
                    ]);

                    user.organitzacions[i].grups[k].activitats = user.organitzacions[i].grups[k].activitats.concat(
                        await strapi.services.activitat.find({'alumnes.id': user.id},[
                            "id","nom","alumnes","professors","alumnes","professors","alumnes.imatgePerfil","professors.imatgePerfil"
                        ])
                    );
                } 
            }

            return user;
        })
        
    }
};
