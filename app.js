const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const _ = require('lodash');

const mongoose = require('mongoose');
require('dotenv').config();

const dbUser=process.env.DB_USER;
const dbPassword=process.env.DB_PASSWORD;
const dbName=process.env.DB_NAME;
const dbUri=`mongodb+srv://${dbUser}:${dbPassword}@cluster0.kzy3l.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.connect(dbUri);

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const itemsSchema = mongoose.Schema({
    name: String
});

const Items = mongoose.model('Items', itemsSchema);
const item1 = new Items({ name: "Welcome to your todolist!" });
const item2 = new Items({ name: "Hit the + button to add a new item" });
const item3 = new Items({ name: "<-- Hit this to delete an item" });
const defaultItems = [item1, item2, item3]

// default load
app.get('/', (req, res) => {
    const day = date();
    Items.find().then(items => {
        if (items.length === 0) {
            Items.insertMany(defaultItems);
        }
        res.render('list', { listTitle: day, items: items });
    })
})

// about route
app.get('/about', (req, res) => {
    res.render("about");
})

// add items 
app.post('/', (req, res) => {
    const listName = req.body.list;
    const newItem = new Items({
        name: req.body.newItem
    });

    List.findOne({ name: listName }).then(foundList => {
        if (!foundList) {
            newItem.save().then(() => { res.redirect('/'); });

        } else {
            foundList.items.push(newItem);
            foundList.save().then(() => { res.redirect('/' + listName); });
        }
    })
})

// delete item
app.post('/delete', (req, res) => {
    const listName = req.body.list;
    List.findOne({ name: listName }).then(foundList => {
        if (!foundList) {
            Items.deleteOne({ _id: req.body.checkbox }).then(() => { res.redirect('/'); });
        } else {
            List.findOneAndUpdate({ name: foundList.name }, { $pull: { items: { _id: req.body.checkbox } } }).then(() => {
                res.redirect('/' + listName);
            });
        }
    })
})

const listSchema = mongoose.Schema({
    name: String,
    items: [itemsSchema]
})
const List = mongoose.model('List', listSchema)

// creating new list on the go
app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }).then(foundList => {
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            })
            list.save().then(() => { res.redirect('/' + customListName); });
        } else {
            res.render('list', { listTitle: foundList.name, items: foundList.items });
        }
    })
})

app.listen(3000, () => {
    console.log("server running on port 3000");
})