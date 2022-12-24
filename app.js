const express = require("express");
const bodyParser = require("body-parser")
const date = require(__dirname + "/date.js")
const mongoose = require("mongoose")
const _=require("lodash")


const app = express();

const day = date.getDay();

//Connecting to local db Server
mongoose.connect('mongodb+srv://KLotfy:test@cluster0.ggnv6ch.mongodb.net/ToDoListDB')
  .then(() => console.log('connected to DB successfully!'))
  .catch(e => console.log(e));

//to apply  ejs
app.set("view engine", "ejs")

//to apply bodyparser
app.use(bodyParser.urlencoded({ extended: true }))


//for the local  files to be applied 
app.use(express.static('public'));
app.use(express.static(__dirname + '/images/'));



//Item Schema
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Empty Field!"]
  }
})


//List Schema 
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema] //The list contains "Items"
})
//List Model (Collection)
const List = mongoose.model("List", listSchema)


//Item Model (Collection)
const Item = mongoose.model("Item", itemsSchema)


//Default  Items
const item1 = new Item({
  name: "Hit the + to add to the list  "
})
const item2 = new Item({
  name: "Hit the checkbox to delete it "
})

const defaultItems = [item1, item2]





//GET METHOD for Home Route
app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {  // foundItems here is an array of all the items 
    if (err) {
      console.log(err)
    }

    else {

      if (foundItems.length < 2) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err)
          }
          else {
            console.log("Added Successfully")
          }

        })

        res.redirect("/")
      }
      else {

        res.render("list", { Items: foundItems, Title: day })

      }
    }

  })

})

//GET METHOD for other routes
app.get("/:customListName", (req, res) => {
  const customListName =_.capitalize( req.params.customListName)

  List.findOne({ name: customListName }, (err, foundList) => { //FoundList here is the object we want to find 
    if (!err) {
      if (!foundList) {
        //Create new list 
        const list = new List({
          name: customListName,
          items: defaultItems

        })
        list.save();
        res.redirect("/" + customListName)
      }
      else {
        //Show existing list 
        res.render("list", { Items: foundList.items, Title: foundList.name })
      }
    }
  }
  )


})





//POST METHOD

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.listButton;

  const item = new Item({
    name: itemName
  })

  if (listName == day) {

    item.save()
      .then(() =>
        res.redirect("/"))

      .catch(error => {
        if (error.name === "ValidationError") {

          res.render("error")
        }

      }

      )

  }

  else {
    List.findOne({ name: listName }, (err, foundList) => {

      foundList.items.push(item)
      foundList.save();
      res.redirect("/" + listName)
    }

    )

  }


})






app.post("/delete", (req, res) => {


  const checkedItemId = req.body.checkbox
  const listName = req.body.listName
  if (listName == day) {
    Item.findByIdAndRemove(checkedItemId, err => {
      if (!err) {

        console.log("Successfully deleted checked item");
        res.redirect("/")
      }
    })
  }
  else {
    List.findOneAndUpdate(
      { name: listName },{ $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName)
        }
      }



    )


  }

})

//Server Initiating
app.listen(3000, () => console.log("Server started on port 3000"))





















