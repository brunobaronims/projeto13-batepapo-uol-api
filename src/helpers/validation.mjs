import Joi from "joi";

export const userSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'Nome inválido',
      'any.required': 'Insira um nome',
      'string.trim': 'Nome não deve conter espaços brancos no começo ou fim'
    })
});

export const messageSchema = Joi.object({
  to: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'Nome inválido',
      'any.required': 'Insira o nome do remetente',
      'string.trim': 'Nome do remetente não deve conter espaços brancos no começo ou fim'
    }),
  text: Joi.string()
    .required()
    .trim()
    .messages({
      'string.base': 'Mensagem inválida',
      'any.required': 'Insira uma mensagem',
      'string.trim': 'Mensagem não deve conter espaços brancos no começo ou fim'
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