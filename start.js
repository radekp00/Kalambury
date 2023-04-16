var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var cluster = require('cluster');
var port = process.env.PORT || 3000;
var pm2 = require('pm2');
const readline = require('readline');
const ytdl = require('ytdl-core');
//const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
//const ffmpeg = require('fluent-ffmpeg');
//ffmpeg.setFfmpegPath(ffmpegPath);


server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));
var hasla = require('./baza.js');
//var hasla = ['kókółełka', 'arłbłuz'];
var haslauzyte = [];

var hid = 0;
var started = 0;
var numUsers = 0;
var sidUsers = [];
var users = [];
var points = [];
var timer = 91;
var kalaburynczyk = 0;
var liczbahasel = hasla.length;

function podmien(data) {
	do {
    data = data.replace("ę", "e");
    data = data.replace("ó", "o");
    data = data.replace("ą", "a");
    data = data.replace("ś", "s");
    data = data.replace("ł", "l");
    data = data.replace("ż", "z");
    data = data.replace("ź", "z");
    data = data.replace("ć", "c");
    data = data.replace("ń", "n");
    data = data.replace("Ę", "e");
    data = data.replace("Ó", "o");
    data = data.replace("Ą", "a");
    data = data.replace("Ś", "s");
    data = data.replace("Ł", "l");
    data = data.replace("Ż", "z");
    data = data.replace("Ź", "z");
    data = data.replace("Ć", "c");
    data = data.replace("Ń", "n");
    } while ((data.indexOf('ę') != -1)||(data.indexOf('ó') != -1)||(data.indexOf('ą') != -1)||(data.indexOf('ś') != -1)||(data.indexOf('ł') != -1)||(data.indexOf('ż') != -1)||(data.indexOf('ź') != -1)||(data.indexOf('ć') != -1)||(data.indexOf('ń') != -1)||(data.indexOf('Ę') != -1)||(data.indexOf('Ó') != -1)||(data.indexOf('Ą') != -1)||(data.indexOf('Ś') != -1)||(data.indexOf('Ż') != -1)||(data.indexOf('Ź') != -1)||(data.indexOf('Ł') != -1)||(data.indexOf('Ć') != -1)||(data.indexOf('Ń') != -1));
    return data;
}

function zmianagracza() {
    kalaburynczyk++;
    if (kalaburynczyk > (sidUsers.length - 1)) kalaburynczyk = 0;
    timer = 91;
    hid = Math.floor(Math.random() * hasla.length);

    do {
        hid = Math.floor(Math.random() * hasla.length);
    } while (haslauzyte.indexOf(hid, 0) != -1);
    haslauzyte.push(hid);
    io.emit('kalala', {
        haslo: 'kalamburynczykiem jest ' + users[kalaburynczyk],
    });
    io.to(sidUsers[kalaburynczyk]).emit('kalala', {
        haslo: 'Twoje hasło to: ' + hasla[hid],
    });
    console.log('haslo gracza '+users[kalaburynczyk]+' to: '+hasla[hid]);
}

io.on('connection', (socket) => {
    var addedUser = false;

    socket.on('new message', (data) => {


        if(started && socket.username == users[kalaburynczyk]){
            data = '';
        }


        var uzytychhasel = haslauzyte.length;
        var zostalohasel = hasla.length - haslauzyte.length;

        var dane = data.toLowerCase();
        if (data == "$$start") {
            if (!started) {

                started = 1;
                

                hid = Math.floor(Math.random() * hasla.length);
                haslauzyte.push(hid);

                io.emit('kalala', {                    haslo: 'kalamburynczykiem jest ' + users[kalaburynczyk],
                });
                io.to(sidUsers[kalaburynczyk]).emit('kalala', {
                    haslo: 'Twoje hasło to: <br> ' + hasla[hid],
                });
                var interval = setInterval(function() {
                    if (timer) --timer;
                    var timee = Math.floor(timer / 60) + ':';
                    if (timer % 60 < 10) {
                        timee = timee + '0' + timer % 60;
                    } else {
                        timee = timee + timer % 60;
                    }

                    io.emit('time', {
                        time: timee,
                        timer: timer,
                    });
                    if (timer == 0) {
                        io.emit('brakodpowiedzi', '');
                        io.emit('new message', {
                            username: '+',
                            message: 'Nikt nie odgadł hasła: "' + hasla[hid].toLowerCase() + '" :(',
                        });
                        zmianagracza();
                    }
                }, 1000);
            }
        } else if (data.substring(0, 5) == "$$yt ") {
            var id = data.slice(5);
            let stream = ytdl(id, {
                quality: 'highestaudio',
                filter: 'audioonly',
            });
            let start = Date.now();
            ffmpeg(stream)
                .audioBitrate(128)
                .save(`${__dirname}/public/audio/${id}.mp3`)
                .on('progress', (p) => {
                    readline.cursorTo(process.stdout, 0);
                    process.stdout.write(`${p.targetSize}kb downloaded`);
                })
                .on('end', () => {
                    console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
                    io.emit('yt', {
                        id: '/audio/' + id + '.mp3'
                    });
                });
        } else if (data == "$$play") {
            io.emit('play', '');
        } else if (data == "$$pause") {
            io.emit('pause', '');

        } else if(data.substring(0, 7) == "$$kick "){
		io.sockets.connected[sidUsers[users.indexOf(data.slice(7))]].disconnect();
		io.emit('new message', {
            username: '-',
            message: 'Użytkownik '+data.slice(7)+' został wyrzucony z serwera.',
            });
        } else if (data.charAt(0) != '$') {
            io.emit('new message', {
                username: socket.username,
                message: data,
            });
            console.log(socket.username+': '+data);
        }

        if ((hasla[hid].toLowerCase()) == dane || podmien(hasla[hid].toLowerCase()) == podmien(dane)) {
            
            io.emit('poprawnaodpowiedz', '');

            io.emit('new message', {
                username: '+',
                message: '"' + hasla[hid].toLowerCase() + '" to poprawne rozwiązanie ! Odgadł: ' + socket.username + ' +20pkt',
            });

            //console.log(sidUsers[kalaburynczyk]);


            var idd = sidUsers.indexOf(socket.id);

            var idrys = sidUsers.indexOf(sidUsers[kalaburynczyk]);
            //console.log('Odgadl: '+idd);
            //console.log('Rysowal: '+idrys);

            var pktzarys = Math.floor(timer / 3);
            //console.log('Punktow za rysowanie: '+pktzarys);

            points[idd] = points[idd] + 20;
            points[idrys] = points[idrys] + pktzarys;

            var sort = [...points];
            sort.sort(function(a, b){return b-a});

            var j = 0;
            users.forEach(function(i) {
                io.emit('add points', {
                    j: j,
                    username: users[points.indexOf(sort[j])],
                    message: points[points.indexOf(sort[j])],
                });
                ++j;
            });
            zmianagracza();
        } else if (dane.length > 2 && (hasla[hid].toLowerCase()).indexOf(dane) != -1 || dane.length > 2 && (podmien(hasla[hid].toLowerCase()).indexOf(dane) != -1)) {
            io.emit('new message', {
                username: '+',
                message: data.toUpperCase() + " Blisko...",
            });
        }

        io.emit('liczba_hasel', {
            liczba_hasel: 'Liczba haseł: ' + liczbahasel,
            uzytych_hasel: 'Liczba użytych haseł: ' + uzytychhasel,
            pozostalo_hasel: 'Pozostało haseł: ' + zostalohasel,
        });

    });


    socket.on('add user', (username) => {
        if (addedUser) return;

        users.push(username);
        sidUsers.push(socket.id);
        points.push(0);
        socket.username = username;
        ++numUsers;


        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });


        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers,
        });

		var j = 0;
		users.forEach(function(i) {
			io.emit('add points', {
				j: j,
				username: users[j],
				message: points[j],
			});
			++j;
		});
    });

    socket.on('start', () => {

    });

    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;

            var j = sidUsers.indexOf(socket.id);
            sidUsers.splice(j, 1);
            points.splice(j, 1);
            users.splice(j, 1);
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        if(numUsers==0){
pm2.connect(function(err) {
  if (err) {
    console.error(err);
    process.exit(2);
  }
  pm2.restart(start, errback);
});



        }
        }
    });
});