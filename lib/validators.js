const { body, validationResult } = require('express-validator/check');

validators = {};

validators.client = [
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

   // “name”: string,
   // “email”: string,
   // “phone”: string


validators.agentAndOperator = [
  body('name', 'Ошибка при вводе названия')
    .exists().withMessage('Обязательное поле')
    .isAlpha().withMessage('Разрешены только алфавитные символы')
    .isLength({min: 1}).withMessage('Длина должна быть больше 1')
    .trim(),
  body('phone', 'Ошибка при вводе телефона')
    .exists().withMessage('Обязательное поле')
    .isMobilePhone('ru-RU').withMessage('Телефон должен быть введен в формате +79000000000')
    .trim(),
  body('email', 'Ошибка при вводе электронной почты')
    .exists().withMessage('Обязательное поле')
    .isEmail().withMessage('Значение не похоже на адрес электронной почты')
    .normalizeEmail(),
  body('password', 'Ошибка при вводе пароля')
    .exists().withMessage('Обязательное поле')
    .isString()
    .isLength({min: 1}).withMessage('Длина должна быть больше 1')
    .trim()
];

module.exports = validators;
