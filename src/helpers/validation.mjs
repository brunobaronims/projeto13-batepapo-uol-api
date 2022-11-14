import Joi from "joi";

export const userSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      'string.base': 'Nome inválido',
      'any.required': 'Insira um nome'
    })
});

export const messageSchema = Joi.object({
  to: Joi.string()
    .required()
    .messages({
      'string.base': 'Nome inválido',
      'any.required': 'Insira um nome'
    }),
  text: Joi.string()
    .required()
    .messages({
      'string.base': 'Mensagem inválida',
      'any.required': 'Insira uma mensagem'
    }),
  type: Joi.string()
    .valid('message', 'private_message')
    .required()
    .messages({
      'string.base': 'Tipos válidos: "message" ou "private_message"',
      'string.valid': 'Tipos válidos: "message" ou "private_message"',
      'any.required': 'Escolha um tipo de mensagem'
    })
});