import Joi from "joi";

export const userSchema = Joi.object({
  name: Joi.string()
  .alphanum()
  .required()
  .messages({
    'string.base': 'Nome inválido',
    'string.alphanum': 'Nome deve conter apenas caracteres alfanuméricos',
    'any.required': 'Insira um nome'
  })
});

export const messageSchema = Joi.object({
  to: Joi.string()
  .alphanum()
  .required(),
  text: Joi.string()
  .alphanum()
  .required(),
  type: Joi.string()
});