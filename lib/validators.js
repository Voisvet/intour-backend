const { body, validationResult } = require('express-validator/check');

validators = {};

validators.validationResult = validationResult;

validators.validatorsClient = [
  body('first_name', 'Ошибка при вводе имени')
    .exists().withMessage('Обязательное поле')
    .isAlpha().withMessage('Разрешены только алфавитные символы')
    .isLength({min: 1}).withMessage('Длина должна быть больше 1')
    .trim(),
  body('last_name', 'Ошибка при вводе фамилии')
    .exists().withMessage('Обязательное поле')
    .isAlpha().withMessage('Разрешены только алфавитные символы')
    .isLength({min: 1}).withMessage('Длина должна быть больше 1')
    .trim(),
  body('phone', 'Ошибка при вводе телефона')
    .exists().withMessage('Обязательное поле')
    .isMobilePhone('ru-RU').withMessage('Телефон должен быть введен в формате +79000000000')
    .trim(),
  body('password', 'Ошибка при вводе пароля')
    .exists().withMessage('Обязательное поле')
    .isString()
    .isLength({min: 1}).withMessage('Длина должна быть больше 1')
    .trim(),
  body('agent_id', 'Ошибка при вводе имени агента')
    .optional()
    .isInt({min: 1}).withMessage('Код агента - целоче число больше 0')
];

module.exports = validators;
   // “first_name”: string,
   // “last_name”: string,
   // “phone”: string,
   // “password”: string,
   // “agent_id”: string
