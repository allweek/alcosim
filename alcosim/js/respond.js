//начало алкобот

function World(name) {
    var new_world = {
        name: name,
        bars: [],
        characters: [],
        daytime: 1000,
        y: 0,
        CreateBar: function(name) {
            var bar = new Bar(name);
            bar.world = new_world;
            new_world.bars.push(bar);
            bar.init();
            return bar;
        },
        CreateCharacter: function(name) {
            var character = new Character(name);
            character.world = new_world;
            new_world.characters.push(character);
            character.init();
            return character;
        },
        stop: function () {
            new_world.characters.forEach (function(elem) {
                clearInterval(elem.interval_person);
            });
            new_world.bars.forEach (function(elem) {
                clearInterval(elem.interval_bar);
            });
        }
    }
    return new_world;
}

function Character(name){
    this.name = name;
    this.count = {
        litr: 0, // количество выпитого персонажем на тек. момент
        money: 0 // сумма денег у персонажа на тек.момент
    };
    this.max_volume = 5; //макс. объем который может выпить персонаж
    this.log = []; //массив с логами
    this.block = $('<div class="block"><img id="img1" src=""><img class="img3" data-is=""><span class="botname1"></span><span class="botinf">' +
        '</span></div>').appendTo('#viewport'); // ячейка бота в таблице
    this.charstat = $('<li><div class="text"><div class="botname2">_</div><div class="lastname">_</div>Пол:<div class="sex">_</div>Баланс, руб.:' +
        '<div class="balance">_</div>Выпито, л.:<div class="drunk">_</div><img id="img2"></div></li>').appendTo('#statlist'); // стат. инфо о боте в слайдере
    this.drink_portion_price = null; //цена 1 порции напитка
    this.drink_price = null; // цена заказа из нескольких порций
    this.drink_volume = null; // объем порции напитка
    this.drink_name = null; // название напитка
    this.world = null;
    this.interval_person;
    this.randarray = [];
    this.j;
    return this;
}

Character.prototype = {
    Log: function(message, type) {
        //кладет лог в массив
        var new_log = {
            'message': message,
            'type': type
        };
        this.log.push(new_log);
        var date  = new Date();
        //русские месяца в дате
        var rus_mounth = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
            'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        var month = rus_mounth[date.getMonth()];
        var time = date.getDate()+' '+month+' '+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes()+
            ':'+date.getSeconds();
        $('<p>'+time+' '+message+'</p>').appendTo('.log');
        //чтобы скролл у лога был внизу
        $('.log').scrollTop(99999);
       /* var history = console[type](message);*/
        //если тип "info" то вызовется console.info(message);
    },
    Gethistory: function (){
        this.log.forEach(function (elem){
            console[elem.type](elem.message);
        });
    },
    Beer: function (l, drink_price){
        //проверяет влезет ли в персонажа ещё алкоголь
        if (this.count.litr < this.max_volume) {
            this.count.litr = (this.count.litr * 10 + l * 10) / 10;
            this.Log(this.name + ' купил ' + l + 'л. ' +this.drink_name+ ' Цена: ' + this.drink_price + 'руб.', 'info');
            this.Log('Всего выпито персонажем ' + this.name + ' '
                + this.count.litr + 'л.', 'info');
            //на случай если выпит макс. объём 
            if (this.count.litr >= this.max_volume) {
                this.Log('Ты напился, иди спать ' + this.name, 'error');
                $('body').append('<div class="modals"></div>');
                $('.modals').text(this.name+' победил!');
                this.block.find('.img3').attr('data-is', 'sleep');
                this.block.find('.botinf').text(' напился и спит');
                this.Log(this.name + ' проснулся полностью трезвый. ', 'info');
                this.count.litr = 0;
                this.world.stop();
            };
        };
    },
    Work: function () {
        //зарабатывает от 0 до 200 рублей. Кратно 50
        var salary = Math.floor(Math.random() * 5) * 50;
        if (salary > 0) {
            this.Log( this.name + ' подзаработал' +
                ' ' + salary + 'руб.', 'info');
        } else {
            this.Log('Подработок для '+this.name+' не было', 'info');
        };
        this.count.money += salary;
    },
    Price: function (l){
        //определяет цену выпитого исходя из выпитого объема
        this.drink_price = Math.round(l / this.drink_volume * this.drink_portion_price);
        this.count.money -= this.drink_price;
    },
    tick: function (){
        //сначала все боты работают
        this.Work();
        //потом они решают пить или нет
        var chance = Math.ceil(Math.random()*100);
        this.Log('Всего денег у ' + this.name + ': ' + this.count.money + 'руб. ', 'info');
        //если chance >= 30 пьют и выбирается напиток 1 из 3
        if (chance >= 30) {
            this.Log(this.name + ' захотел выпить.', 'info');
            if ((chance >= 30) && (chance <= 60)) {
                //пиво
                this.drink_portion_price = this.world.bars[0].bottle_price;
                this.drink_volume = 0.5;
                this.drink_name = 'пива';
            } else {
                if ((chance > 60) && (chance <= 80)) {
                    //текила
                    this.drink_portion_price = this.world.bars[0].teq_price;
                    this.drink_volume = 0.1;
                    this.drink_name = 'текилы';
                } else {
                    //водка
                    this.drink_portion_price = this.world.bars[0].shot_price;
                    this.drink_volume = 0.1;
                    this.drink_name = 'водки';
                };
            };
            //проверка хватит ли денег хотя бы на 1 порцию выбранного напитка
            if (this.count.money >= this.drink_portion_price) {
                this.block.find('.img3').attr('data-is', 'drink');               
                this.block.find('.botinf').text('\n выпил');
                //вычисляется макс. объем напитка который может купить бот
                var max_volume_to_buy = Math.floor(this.count.money / this.drink_portion_price) * this.drink_volume;
                //случайным образом выбирается кол-во порций которое купит бот и пересчитывается в литры
                var l = ((Math.ceil(Math.random() * (max_volume_to_buy / this.drink_volume))) * this.drink_volume).toFixed(1);
                //проверяется влезет ли этот объем в бота
                //если влезет
                if (l <= (this.max_volume - this.count.litr)) {
                    this.Price(l);
                    this.Beer(l, this.drink_price);
                    this.Log('Денег осталось у ' + this.name + ':' + this.count.money + ' руб.', 'info');
                    this.charstat.find('.balance').text(this.count.money);
                } else {
                    //если не влезет, берем макс объем кот. влезет
                    l = (this.max_volume * 10 - this.count.litr * 10) / 10;

                    if (l > 0) {
                        this.Price(l);
                        this.Log(max_volume_to_buy + 'л.? Ты столько не выпьешь! В тебя влезет только ' +
                            l + 'л.', 'error');
                        this.Beer(l, this.drink_price);
                        this.charstat.find('.balance').text(this.count.money);
                    } else {
                        //если пользователь изменяет max_volume на меньше чем уже было выпито на текущий момент
                        this.drink_price = 0;
                        this.Log('Ты напился, иди спать ' + this.name, 'error');
                        this.block.find('.img3').attr('data-is', 'sleep');
                        this.block.find('.botinf').text(' напился и спит');
                        this.Log(this.name + ' проснулся полностью трезвый. ', 'info');
                        this.count.litr = 0;
                    };
                };
            } else {
                //если у бота не хватило денег на выбранный напиток
                this.drink_price = 0;
                this.Log('У ' + this.name + ' нет хватает денег чтобы выпить '+this.drink_name+'. Пусть Проваливает!', 'error');
                this.block.find('.img3').attr('data-is', 'fail');
                this.block.find('.botinf').text(' не хватает $');
            };
        } else {
            //если chance < 30 бот не пьет
            this.drink_price = 0;
            this.Log(this.name + ' решил не бухать.', 'info');
            this.block.find('.img3').attr('data-is', 'work');
            this.block.find('.botinf').text(' решил не бухать');
            
        };
        this.charstat.find('.balance').text(this.count.money);
        this.charstat.find('.drunk').text(this.count.litr);
        this.world.bars[0].gross_profit += this.drink_price; 
        this.world.bars[0].renderBalance();   
    },

    init: function() {
        var self = this;
        var preload = $('#preload');
        var circle = function () {
            self.j = Math.floor(Math.random()*189);
            VK.Api.call('friends.get', {user_id: 2347929, fields: 'photo_100, photo_50, first_name, last_name, sex'}, function(r) {
                if(r.response) {
                    self.block.find('#img1').attr('src', r.response[self.j].photo_100);
                    self.charstat.find('#img2').attr('src', r.response[self.j].photo_50);
                    self.block.find('.botname1').text(r.response[self.j].last_name);
                    self.charstat.find('.botname2').text(r.response[self.j].first_name);
                    self.charstat.find('.lastname').text(r.response[self.j].last_name);
                    self.name = r.response[self.j].last_name;
                    if (r.response[self.j].sex == 2) {
                    self.charstat.find('.sex').text('Муж.');
                    } else {
                        self.charstat.find('.sex').text('Жен.');
                    };
                    self.world.y++;
                    preload.text(self.world.y + ' из 16 ботов запущено');
                    start();
                    if (self.world.y == 16) {
                        $('.modals').remove();
                    };
                } else {
                    setTimeout(function () {
                    circle();
                    }, 400);
                };
            });
        };
        circle();

        //определяется макс. объем выпитого для аклогоботов
        $('#max_volume').val(this.max_volume);
        var self = this;
        $("#max_volume").change(function() {
            self.max_volume = $(this).val();
        });

        //запускается алкобот: каждые 3 сек. работает/пьет

        function start() {
            self.interval_person = setInterval(function(){
                self.tick();
            }, self.world.daytime * 3);
        };
    },   
}

function Bar(name) {
    this.name = name;
    this.gross_profit = 0; // текущая выручка бара
    this.net_profit_total = 0; // выручка бара - затраты накопительно
    this.costs = 0; // тек. затраты бара
    this.costs_total = 0; // затраты бара накопительно
    this.bottle_price = 50; // цена пива
    this.shot_price = 80; //цена водки
    this.teq_price = 100; //цена текилы
    this.interval_bar;
    return this;
};

Bar.prototype = {
    renderBalance: function (){      
        //выводит тек. выручу бара и затраты
        $('#gross').text(this.world.bars[0].gross_profit);
        $('#costs').text(this.world.bars[0].costs);

    },
    Costs: function (){
        //выводит накопительно выручку бара и затраты
        console.error(' выручка '+this.world.bars[0].gross_profit);
        this.world.bars[0].costs = Math.round(this.world.bars[0].gross_profit * 0.4 + 2000);
        console.error(' затраты '+this.world.bars[0].costs);
        this.world.bars[0].costs_total += this.world.bars[0].costs;
        this.world.bars[0].net_profit_total += (this.world.bars[0].gross_profit-this.world.bars[0].costs);
        $('#costs').text(this.world.bars[0].costs);
        $('#costs_total').text(this.world.bars[0].costs_total);
        $('#net_profit_total').text(this.world.bars[0].net_profit_total);
        this.world.bars[0].costs = 0;
        this.world.bars[0].gross_profit = 0;
    },
    init: function () {
        //присваивает имя бара
        $('#barname').text(this.name);
        var self = this;
        //бар несет затраты каждые 20сек
        this.interval_bar = setInterval(function(){
            self.Costs();
        }, self.world.daytime * 20);

        //определяются цены напитков
        $('#bottle_price').val(this.bottle_price);
        $("#bottle_price").change(function() {
            self.bottle_price = $(this).val();
        });
        this.world.bars[0].bottle_price = this.bottle_price;

        $('#shot_price').val(this.shot_price);
        $("#shot_price").change(function() {
            self.shot_price = $(this).val();
        });
        this.world.bars[0].shot_price = this.shot_price;

        $('#teq_price').val(this.teq_price);
        $("#teq_price").change(function() {
            self.teq_price = $(this).val();
        });
        this.world.bars[0].teq_price = this.teq_price;

    }
};

$(document).on('ready', function (){
    var world = new World ('Мир');

    for (var i = 1; i <= 16; i++) {
        world.CreateCharacter('Alcobot-'+i);
        console.error('Alcobot-'+i+' создан');
    };
    var bar = new world.CreateBar('БАРРАКУДА');
    Timer ();
    Slider();

});

function Slider () {
    var position = 0;
    var number = 0;
    rightbutton.addEventListener("click", slide2);
    function slide2() {
        if (position == 0) {
            number = 4;
            position = -400;
        } else {
            if (position == -400) {
                number = 8;
                position = -800;
            } else {
                if (position == -800) {
                    number = 12;
                    position = -1200;
                } else {
                    return;
                };
            };
        };
        statlist.style.marginLeft = (-100 * number) + 'px';
    };
    leftbutton.addEventListener("click", slide1);
    function slide1() {
        if (position == 0) {
            return;
        } else {
            if (position == -400) {
                number = 0;
                position = 0;
            } else {
                if (position == -800) {
                    number = 4;
                    position = -400;
                } else {
                    if (position == -1200) {
                        number = 8;
                        position = -800;
                    };
                };
            };
        };
        statlist.style.marginLeft = (-100 * number) + 'px';
    };
};


function Timer () {
    var b = 0;
    setInterval(function () {
        b = b + 1;
        $('#timer').text(b);
    }, 1000);

};