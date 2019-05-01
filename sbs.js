const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require('fs');
const os = require("os");
var NodeGeocoder = require('node-geocoder');

var logStream = fs.createWriteStream("log-file.txt", { flags: 'a' });


var userCon = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'spotbuddyrjm'
});

userCon.connect(function (err) {
    if (err) throw err;
    console.log("Connected to SpotBuddy MYSQL DB!")
    logStream.write("Connected to SpotBuddy MYSQL DB!" + os.EOL)
})

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const port = 80;
async function geocode(address,uid) {
    console.log(address);
    var options = {
        provider: 'google',

        // Optional depending on the providers
        httpAdapter: 'https', // Default
        apiKey: 'AIzaSyCKF0IPwo5nC8VlNrnykvt4a0CTgkfOMs8', // for Mapquest, OpenCage, Google Premier
        formatter: null         // 'gpx', 'string', ...
    };

    var geocoder = NodeGeocoder(options);

    // Using callback
    var resString = "";
    await geocoder.geocode(address, function (err, res) {
        console.log(res[0].latitude);
        resString+= res[0].latitude.toString() + ',' + res[0].longitude.toString();
        console.log(resString);
        var updateQuery = `UPDATE spotbuddy.users SET focusedLocationID = '${resString}' Where uid = ${uid};`;
                console.log(updateQuery);
                userCon.query(updateQuery, function (err, Updateresult) {
                    if (err) { console.log(`SQL Error: ${err}`) }
                    else {
                        datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                        console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(Updateresult)}`);
        
                    }
                });
    });
    


}


app.get('/', (req, res) => res.send("Hello SpotBuddy Team from Richard!"));

//Profile//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/updateProfileLatLon', function (req, res) {
    latlng = [];
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    //console.log(`Request Query: ${JSON.stringify(req.query)}`);
    //logStream.write("Update All Profiles - " + datetime + ` : Request Query: ${JSON.stringify(req.query)}` + os.EOL);
    var query = `SELECT uid,broadLocationID from spotbuddy.users;`;
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            result.forEach(function (value) {
                console.log(value.broadLocationID);
                latlng.push({"address":value.broadLocationID,"uid":value.uid});
            })
            console.log(latlng);
            latlng.forEach(function (value) {
                console.log(value);
                var coordinates=geocode(value['address'],value['uid']);
                console.log("Coordinates: " + coordinates);
                
            })
        }
    });
    

    res.send("Updated Latitudes and Longitudes").status(200);

});

app.get('/getAllProfiles', function (req, res) {
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`Request Query: ${JSON.stringify(req.query)}`);
    logStream.write("Get All Profiles - " + datetime + ` : Request Query: ${JSON.stringify(req.query)}` + os.EOL);
    var query = `SELECT uid,first_name,broadLocationID,focusedLocationID from spotbuddy.users LIMIT 6;`;
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });

});

app.get('/getProfileInterests', function(req,res){
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`Request Query: ${JSON.stringify(req.query)}`);
    logStream.write("Get All Profiles - " + datetime + ` : Request Query: ${JSON.stringify(req.query)}` + os.EOL);
    var query = `SELECT * FROM spotbuddy.interests where uid=${req.query.uid} LIMIT 3;`;
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            logStream.write("Get Profile Interests - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });
});

app.get('/getProfile', function (req, res) {
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`Request Query: ${JSON.stringify(req.query)}`);
    logStream.write("Get Profile - " + datetime + ` : Request Query: ${JSON.stringify(req.query)}` + os.EOL);
    var query = `SELECT * from spotbuddy.users WHERE uid=${req.query.uid} LIMIT 1;`;
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });

});

app.get('/signin/', function (req, res) {
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(req);
    logStream.write("Sign in - " + datetime + `: Request Query: ${JSON.stringify(req.query)}` + os.EOL);
    var query = `SELECT * from spotbuddy.users WHERE email="${req.query.email}" AND pass="${req.query.pass}" LIMIT 1;`;
    console.log(query);
    userCon.query(query, function (err, result) {
        if (err) {
            //console.log(result)
            res.status(400).json({
                status: "Account NOT Found",
                accessToken: null,
            });
            console.log(err);
            return;
        }
        // else if (!Array.isArray(result) || !result.length){
        //     console.log(result)
        //     res.status(400).json({
        //         status:"Account NOT Found",
        //         accessToken:null,
        //     });
        // }
        else {
            console.log(result);
            console.log(result[0].uid);
            res.status(200).json({
                status: "Account Found",
                accessToken: "Some Access Token",
                uid: result[0].uid.toString(),
            });
        }

    });

});

app.post('/createProfile/', function (req, res) {
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    logStream.write("Create Profile - " + datetime + `: Request Body: ${JSON.stringify(req.body)}` + os.EOL);
    console.log(datetime);
    console.log(req.body);
    var query = `INSERT INTO spotbuddy.users
    (first_name,
    email,
    pass,
    birthday,
    messangerID,
    broadLocationID,
    focusedLocationID,
    biography,
    isABuddy,
    publicRating,
    govtID,
    timestamp)
    VALUES
    ('${req.body.first_name.toString()}',
    '${req.body.email.toString()}',
    '${req.body.pass.toString()}',
    '${req.body.birthday.toString()}',
    '${req.body.messangerID.toString()}',
    '${req.body.broadLocationID.toString()}',
    '${req.body.focusedLocationID.toString()}',
    '${req.body.biography.toString()}',
    '${req.body.isABuddy.toString()}',
    '${req.body.publicRating.toString()}',
    '${req.body.govtID.toString()}',
    '${datetime}')`;
    console.log(query);
    userCon.query(query, function (err, result) {
        if (err) {
            console.log(err.code)
            if (err.code == "ER_DUP_ENTRY") {
                res.status(400).send('Could not create profile - Duplicate Entry');
                return;
            }
            else {
                res.status(400).send('Could not create profile');
                return;
            }

        }
        else {
            console.log('Result:' + result);
            resultString = result.toString();
            if (resultString.slice(0, 5) == 'Error') {
                res.status(400).send('Could not create profile');
                return;
            }
            datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            logStream.write("Create Profile - " + datetime + `: Account Created: ${JSON.stringify(result)}` + os.EOL);
            res.status(200).send('Created a profile');
        }

    });

});

app.post('/updateProfile/', function (req, res) {
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    logStream.write("updateProfile - " + datetime + `: Request Body: ${JSON.stringify(req.body)}` + os.EOL);
    console.log(req.body);
    var query = `UPDATE spotbuddy.users
    SET biography = "${req.body.biography}" WHERE uid = ${req.body.uid};`
    console.log(query);
    userCon.query(query, function (result, err) {
        if (err) { console.log(err) }
        else {
            console.log('Result:' + result);
            logStream.write("Update Profile - " + datetime + `: Account Updated: ${JSON.stringify(result)}` + os.EOL);
        }

    });
    res.status(200).send('Updated profile');
});


//Event - Attendees///////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/createEvent', function (req, res) {
    console.log(req.body)
    query = `INSERT INTO spotbuddy.events(address,date,timeStart,timeEnd,description,hostUID,title,maxAttendees,currentAttendees)
        VALUES
        (
        '${req.body.address}',
        '${req.body.date}',
        '${req.body.timeStart}',
        '${req.body.timeEnd}',
        "${req.body.description}",
        '${req.body.hostUID}',
        '${req.body.title}',
        '${req.body.maxAttendees}',
        '1');`;

    userCon.query(query, function (err, result) {
        if (err) {
            console.log(err)
            console.log(err.code)
            if (err.code == "ER_DUP_ENTRY") {
                res.status(400).send('Event Already Exists');
                return;
            }
            else {
                res.status(400).send('Could not create Event');
                return;
            }

        }
        else {
            temp = {
                "result": result,

            }
        }
    });
    getQuery = `Select eventID from spotbuddy.events WHERE hostUID="${req.body.uid}" AND title="${req.body.title}" LIMIT 1;`
    userCon.query(getQuery, function (geterr, getResult) {
        if (geterr) {
            console.log(geterr)
            console.log(geterr.code)
            if (geterr.code == "ER_DUP_ENTRY") {
                //res.send('Event Already Exists');
                return;
            }
            else {
                //res.send('Could not find Event');
                return;
            }

        }
        else {
            console.log('Result:' + getResult);
            console.log(getResult);
            res.json(temp);
        }
    });

    // resultString = result.toString();
    // if (resultString.slice(0, 5) == 'Error') {
    //     res.status(400).send('Could not create profile');
    //     return;
    // }
    // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    // logStream.write("Create Profile - " + datetime + `: Account Created: ${JSON.stringify(result)}` + os.EOL);


});

app.get('/getEvent', function (req, res) {
    query = `Select * from spotbuddy.events WHERE eventID=${req.query.eventID}`
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });
})

app.get('/getEventInterests', function(req,res){
    query = `Select * from spotbuddy.event_interests WHERE eventID=${req.query.eventID} LIMIT 3;`
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });
});

app.get('/getAllEvents', function (req, res) {
    query = `Select * from spotbuddy.events`
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });
})

app.get('/getAttendees', function (req, res) {
    query = `Select * from spotbuddy.attendees WHERE eventID=${req.query.eventID}`
    userCon.query(query, function (err, result) {
        if (err) { console.log(`SQL Error: ${err}`) }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });
})

app.post('/attendEvent', function (req, res) {
    query = `INSERT INTO spotbuddy.attendees    (
    eventID,
    hostUID,
    requesterID,
    status,
    timestamp)
    VALUES
    (
    ${req.body.eventID},
    ${req.body.hostUID},
    ${req.body.requesterID},
    ${req.body.status},
    CURRENT_TIMESTAMP
    );`
    userCon.query(query, function (err, result) {
        if (err) {
            console.log(`SQL Error: ${err}`)
            res.status(400).json(err)
        }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            res.json(result).status(200);
        }
    });
})

//Friendship////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/createFriendship', function (req, res) {
    query = `INSERT INTO spotbuddy.friend
    (sender,
    receiver,
    status)
    VALUES
    (${req.body.sender},
    ${req.body.receiver},
    2);`

    userCon.query(query, function (err, result) {
        if (err) {
            console.log(`SQL Error: ${err.message}`)
            res.status(400).json(err)
        }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            console.log(result)
            res.json(result).status(200);
        }
    });
})

app.post('/updateFriendship', function (req, res) {
    query = `UPDATE spotbuddy.friend
    SET
    status = ${req.body.status}
    WHERE sender = ${req.body.sender}
    AND receiver = ${req.body.receiver};`

    userCon.query(query, function (err, result) {
        if (err) {
            console.log(`SQL Error: ${err.message}`)
            res.status(400).json(err)
        }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            console.log(result)
            res.json(result).status(200);
        }
    });
})

//Interests////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/usersWithInterest', function (req, res) {
    var query = `SELECT * FROM spotbuddy.interests where interest="${req.query.interest}";`

    userCon.query(query, function (err, result) {
        if (err) {
            console.log(`SQL Error: ${err.message}`)
            res.status(400).json(err)
        }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            console.log(result)
            res.json(result).status(200);
        }
    });
});

app.get('/userInterest', function (req, res) {
    var query = `SELECT * FROM spotbuddy.interests where interest="${req.query.uid}";`

    userCon.query(query, function (err, result) {
        if (err) {
            console.log(`SQL Error: ${err.message}`)
            res.status(400).json(err)
        }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            console.log(result)
            res.json(result).status(200);
        }
    });
});


app.post('/addInterest', function (req, res) {
    var query = `INSERT INTO spotbuddy.interests
    (uid,
    interest)
    VALUES
    (${req.body.uid},
    "${req.body.interest}");`

    userCon.query(query, function (err, result) {
        if (err) {
            console.log(`SQL Error: ${err.message}`)
            res.status(400).json(err)
        }
        else {
            // datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // console.log(`SQL Query successful: ${datetime} \n ${JSON.stringify(result)}`);
            // logStream.write("Get Profile - " + datetime + ` SQL Query successful: ${datetime} \n ${JSON.stringify(result)}` + os.EOL);
            console.log(result)
            res.json(result).status(200);
        }
    });
});

app.listen(port, function () {
    datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`SpotBuddy Running on Port ${port}!`);
    logStream.write(datetime + `: SpotBuddy Running on Port ${port}!` + os.EOL);
});