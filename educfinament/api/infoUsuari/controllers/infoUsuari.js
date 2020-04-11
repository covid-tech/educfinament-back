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
            ctx.response.badRequest("Usuari o Contrasenya incorrectes");
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
        return await strapi.query('user', 'users-permissions').findOne({id: ctx.params.id}, [
            "alumneOrganitzacions","alumneGrups","alumneActivitats","professorOrganitzacions","professorGrups","professorActivitats",
            "alumneGrups.organitzacio","professorGrups.organitzacio","alumneActivitats.grup","professorActivitats.grup",
            "alumneActivitats.grup.organitzacio","professorActivitats.grup.organitzacio",
            "alumneActivitats.videos","alumneActivitats.videoInici",
            "professorActivitats.videos","professorActivitats.videoInici",
            "alumneActivitats.videos.enviatPer","professorActivitats.videos.enviatPer",
        ]).then(async user => {
            //console.log(user);
            let jerarquiaUsuari = [];

            jerarquiaUsuari = this.generaJerarquiaAPartirActivitat(jerarquiaUsuari, false, user.alumneActivitats);
            jerarquiaUsuari = this.generaJerarquiaAPartirActivitat(jerarquiaUsuari, true, user.professorActivitats);

            jerarquiaUsuari = this.generaJerarquiaAPartirGrup(jerarquiaUsuari, false, user.alumneGrups);
            jerarquiaUsuari = this.generaJerarquiaAPartirGrup(jerarquiaUsuari, true, user.professorGrups);

            jerarquiaUsuari = this.generaJerarquiaAPartirOrganitzacio(jerarquiaUsuari, false, user.alumneOrganitzacions);
            jerarquiaUsuari = this.generaJerarquiaAPartirOrganitzacio(jerarquiaUsuari, true, user.professorOrganitzacions);

            user.organitzacions = jerarquiaUsuari;
            delete user.alumneOrganitzacions;
            delete user.alumneGrups;
            delete user.alumneActivitats;
            delete user.professorOrganitzacions;
            delete user.professorGrups;
            delete user.professorActivitats;
            return user;
        })        
    },

    generaJerarquiaAPartirActivitat(jerarquia, socProfessor, array) {
        let idGrup = null, idOrganitzacio = null; 
        let activitat = null, grup = null, organitzacio = null; 

        for(let i=0; i<array.length; i++) {
            activitat = array[i];
            grup = array[i].grup;
            organitzacio = array[i].grup.organitzacio;

            console.log("GRUP:",grup);
            console.log("ORGANITZACIO:", organitzacio);

            idOrganitzacio = jerarquia.findIndex(x => x.id == organitzacio.id);
            if(idOrganitzacio == -1) {
                organitzacio.socProfessor = false;
                organitzacio.grups = [];
                jerarquia.push(organitzacio);
                idOrganitzacio = jerarquia.length - 1;
            }

            idGrup = jerarquia[idOrganitzacio].grups.findIndex(x => x.id == grup.id);
            console.log(jerarquia);

            if(idGrup == -1) {
                grup.socProfessor = false;
                grup.activitats = [];
                delete grup.organitzacio;
                jerarquia[idOrganitzacio].grups.push(grup);
                idGrup = jerarquia[idOrganitzacio].grups.length - 1;
            }

            activitat.socProfessor = socProfessor;
            delete activitat.grup.organitzacio;
            delete activitat.grup;
            jerarquia[idOrganitzacio].grups[idGrup].activitats.push(activitat);
        }

        return jerarquia;
    },
    
    generaJerarquiaAPartirGrup(jerarquia, socProfessor, array) {
        let idGrup = null, idOrganitzacio = null; 
        let grup = null, organitzacio = null; 

        for(let i=0; i<array.length; i++) {
            grup = array[i];
            organitzacio = array[i].organitzacio;

            idOrganitzacio = jerarquia.findIndex(x => x.id == organitzacio.id);
            if(idOrganitzacio == -1) {
                organitzacio.socProfessor = false;
                organitzacio.grups = [];
                jerarquia.push(organitzacio);
                idOrganitzacio = jerarquia.length - 1;
            }

            idGrup = jerarquia[idOrganitzacio].grups.findIndex(x => x.id == grup.id);
            if(idGrup == -1) {
                grup.activitats = [];
                delete grup.organitzacio;
                jerarquia[idOrganitzacio].grups.push(grup);
                idGrup = jerarquia[idOrganitzacio].grups.length - 1;
            }

            jerarquia[idOrganitzacio].grups[idGrup].socProfessor = socProfessor;
        }

        return jerarquia;
    },
    
    generaJerarquiaAPartirOrganitzacio(jerarquia, socProfessor, array) {
        let idOrganitzacio = null; 
        let organitzacio = null; 

        for(let i=0; i<array.length; i++) {
            organitzacio = array[i];

            idOrganitzacio = jerarquia.findIndex(x => x.id == organitzacio.id);
            if(idOrganitzacio == -1) {
                jerarquia.push(organitzacio);
                idOrganitzacio = jerarquia.length - 1;
            }

            jerarquia[idOrganitzacio].socProfessor = socProfessor;
        }

        return jerarquia;
    },
};
