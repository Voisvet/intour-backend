const { body, query, param } = require('express-validator/check');

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
    .isInt({min: 0}).withMessage('Код агента - целоче число больше 0')
];

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

validators.reservation = [
  body('excursion_id', 'Ошибка при вводе ID экскурсии')
    .exists().withMessage('Обязательное поле')
    .isInt({min: 1}).withMessage('Минимальное значение 1'),
  body('adult_tickets_amount', 'Ошибка при вводе числа взрослых билетов')
    .exists().withMessage('Обязательное поле')
    .isInt({min: 0}).withMessage('Минимальное значение 0'),
  body('child_tickets_amount', 'Ошибка при вводе числа детских билетов')
    .exists().withMessage('Обязательное поле')
    .isInt({min: 0}).withMessage('Минимальное значение 1'),
  body('date', 'Ошибка при вводе даты')
    .exists().withMessage('Обязательное поле')
    .isInt({min: 0}).withMessage('Минимальное значение 0'),
];

validators.login = [
  query('login', 'Ошибка при вводе номера телефона')
    .exists().withMessage('Обязательное поле')
    .isMobilePhone('ru-RU').withMessage('Телефон должен быть введен в формате +79000000000')
    .trim(),
  query('pass', 'Ошибка при вводе пароля')
    .exists().withMessage('Обязательное поле')
    .isString()
    .isLength({min: 1}).withMessage('Длина должна быть больше 1')
    .trim(),
];

validators.id = [
  param('id', 'Ошибка при вводе ID')
    .exists().withMessage('Обязательное поле')
    .toInt()
    .isInt({min: 1}).withMessage('Минимальное значение 1'),
];

module.exports = validators;
