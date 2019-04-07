const db = require('../models');

Excursion = db.sequelize.model('Excursion');
ExcursionImage = db.sequelize.model('ExcursionImage');
ExcursionSchedule = db.sequelize.model('ExcursionSchedule');
Country = db.sequelize.model('Country');
City = db.sequelize.model('City');

storage = {};

async function fillInData() {
  let transaction;

  try {
    transaction = await db.sequelize.transaction();

    const greece = await Country.create({name: 'Греция'}, {transaction});
    const city = await City.create({name: 'Ираклион', countryId: greece.id}, {transaction});
    const city2 = await City.create({name: 'Афины', countryId: greece.id}, {transaction});

    russia = await Country.create({name: 'Россия'}, {transaction});
    const city3 = await City.create({name: 'Иннополис', countryId: russia.id}, {transaction});
    const city4 = await City.create({name: 'Новокубанск', countryId: russia.id}, {transaction});

    // --------------------------------------------------
    //
    // Кносский дворец
    //
    // --------------------------------------------------

    kd_images = [
      await ExcursionImage.create({link: '/images/000000.jpg'}, {transaction}),
      await ExcursionImage.create({link: '/images/000001.jpg'}, {transaction}),
      await ExcursionImage.create({link: '/images/000002.jpg'}, {transaction}),
      await ExcursionImage.create({link: '/images/000003.jpg'}, {transaction}),
    ];

    kd_schedule = [
      await ExcursionSchedule.create({weekDay: 'mon', time: '07:00:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'tue', time: '08:00:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'wed', time: '09:00:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'thu', time: '10:00:00'}, {transaction}),
    ];

    kd_excursion = await Excursion.create({
      title: 'Кносский дворец',
      duration: 360,
      type: 'HSTR',
      services: ['BUS', 'HUMN'],
      description: 'Кносский дворец расположен на острове Крит, в древнем городе Кносс. В греческой мифологии Кносс связывается с именем легендарного критского царя Миноса. По легенде, в окрестностях находился лабиринт Дедала, где был заключён Минотавр.\n' +
        'Прогулка в сопровождении гида по столице острова пройдет с посещением археологического музея Ираклиона и Кносского дворца. Вы познакомитесь с достопримечательностями и услышите легенды, связанные с этим местом, из уст вашего экскурсовода. Поездка проводится в первую половину дня, так что в летний сезон не забудьте взять с собой головной убор и воду — будет жарко!\n',
      starting_point: 'Вас заберут из вашего отеля',
      adult_ticket_cost: 1960,
      child_ticket_cost: 1400,
      cityId: city.id
    }, {transaction});

    await kd_excursion.setImages(kd_images, {transaction});
    await kd_excursion.setSchedule(kd_schedule, {transaction});

    // --------------------------------------------------
    //
    // Бухта Балос
    //
    // --------------------------------------------------

    bb_images = [
      await ExcursionImage.create({link: '/images/000004.jpg'}, {transaction}),
      await ExcursionImage.create({link: '/images/000005.jpg'}, {transaction}),
      await ExcursionImage.create({link: '/images/000006.jpg'}, {transaction}),
    ];

    bb_schedule = [
      await ExcursionSchedule.create({weekDay: 'fri', time: '06:30:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'sat', time: '06:30:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'wed', time: '06:30:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'thu', time: '06:30:00'}, {transaction}),
    ];

    bb_excursion = await Excursion.create({
      title: 'Бухта Балос',
      duration: 870,
      type: 'WAVE',
      services: ['BUS', 'HUMN', 'BOAT'],
      description: 'Балос - бухта, расположенная на западном побережье полуострова Грамвуса острова Крит. К северу от бухты Балос, на мысе Корикон, находятся развалины небольшого древнего римского города Агнион с храмом бога Аполлона.\n' +
        'Большую часть бухты составляет отмель. Дно полностью песчаное, песок преимущественно белый. Пляжи на бухте считаются «дикими», однако они пользуются большой популярностью среди туристов.\n' +
        'Экскурсия начнется с поездки вдоль всего северного побережья острова и до города Киссамос, где превратится в морской круиз. Корабль доставит вас на холмистый остров Грамвуса, где на вершине холма сохранились остатки крепости откуда открывается потрясающий вид на пляж Балос и бескрайнее море. Время пребывания на острове порядка двух часов, на пляже — около трёх часов.\n',
      starting_point: 'Вас заберут из вашего отеля',
      adult_ticket_cost: 2520,
      child_ticket_cost: 2100,
      cityId: city.id
    }, {transaction});

    await bb_excursion.setImages(bb_images, {transaction});
    await bb_excursion.setSchedule(bb_schedule, {transaction});

    // --------------------------------------------------
    //
    // Пляж Элафонисос
    //
    // --------------------------------------------------

    pe_images = [
      await ExcursionImage.create({link: '/images/000007.jpg'}, {transaction}),
      await ExcursionImage.create({link: '/images/000008.jpg'}, {transaction}),
      await ExcursionImage.create({link: '/images/000009.jpg'}, {transaction}),
    ];

    pe_schedule = [
      await ExcursionSchedule.create({weekDay: 'fri', time: '08:00:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'sat', time: '08:00:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'wed', time: '08:00:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'thu', time: '08:00:00'}, {transaction}),
      await ExcursionSchedule.create({weekDay: 'sun', time: '08:00:00'}, {transaction}),
    ];

    pe_excursion = await Excursion.create({
      title: 'Пляж Элафонисос',
      duration: 630,
      type: 'WTCH',
      services: ['BUS', 'HUMN', 'FORK'],
      description: 'Элафонисос — небольшой остров в заливе Лаконикос Эгейского моря. Находится он у юго-восточной оконечности Пелопоннеса к западу от полуострова Элос и мыса Малея. На Элафонисосе расположена волшебная лагуна с кристально чистой водой и прекрасным пляжем с мелким и местами розовым песком. Элафонисос - это удивительный природный заповедник. Экскурсионная группа отправляется из западных районов острова рано утром: по пути нас ждёт пещера Агии Софии, затем пляж Элафонисос, после обед в таверне и кофе в деревне Элафонисос.',
      starting_point: 'Вас заберут из вашего отеля',
      adult_ticket_cost: 2520,
      child_ticket_cost: 2100,
      cityId: city.id
    }, {transaction});

    await pe_excursion.setImages(pe_images, {transaction});
    await pe_excursion.setSchedule(pe_schedule, {transaction});

    await transaction.commit();
  } catch (err) {
    if (err && transaction) await transaction.rollback();
    console.log(err);
  }
}

fillInData().catch(err => log);


// Promise.all([
//   ExcursionImage.create({link: 'https://404store.com/2017/10/01/246394.jpg'}),
//   ExcursionImage.create({link: 'https://img2.goodfon.ru/original/1920x1200/6/60/birshtadt-peyzazh-gory-vodopad.jpg'})
// ])
//   .then((images) => {
//     storage.images = images;
//     return Promise.all([
//       ExcursionSchedule.create({weekDay: 'mon', time: '08:00:00'}),
//       ExcursionSchedule.create({weekDay: 'sat', time: '12:00:00'})
//     ]);
//   })
//   .then(schedules => {
//     storage.schedules = schedules;
//     return Excursion.create({
//       title: 'Test Excursion',
//       duration: 30,
//       type: 'BUS',
//       services: ['SERV1', 'SERV2'],
//       description: 'This is a test excursion. Don\'t try to give it some meaning.',
//       starting_point: 'U cherta na kulichikah',
//       adult_ticket_cost: 12.5,
//       child_ticket_cost: 10.0,
//       region: 'test region'
//     });
//   })
//   .then(excursion => {
//     return Promise.all([
//       excursion.setImages(storage.images),
//       excursion.setSchedule(storage.schedules)
//     ]);
//   })
//   .then(() => {
//     console.log('Success');
//   });
