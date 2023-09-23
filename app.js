//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//connect to mongoDB
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb+srv://laurahuang:rrcwkj4oLmKtRaT6@cluster0.jjlxwph.mongodb.net/test?retryWrites=true&w=majority');
}

//schema1: used for the home route
const itemsSchema = {
  name: String,
};
const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to the client checklist."
});

const item2 = new Item({
  name: "Hit + button to create a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//schema2: used for the branch route
const listSchema = {
  name: String,
  items: [itemsSchema]   // note: it's "items" not "item"

};

const List = mongoose.model("List", listSchema)

app.get("/", function (req, res) {
  Item.find()
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        // insert the default items to mongoDB
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved default items");
            res.redirect("/");
          })
          .catch(function (err) {
            console.log(err);
          });
      } else {
        res.render("list", { listTitle: "Summary", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  // Add the following code to save the item to the default list as well
  Item.insertMany([item])
    .then(function () {
      console.log("Successfully saved item to default list");
    })
    .catch(function (err) {
      console.log(err);
    });
});


app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save()
          .then(function () {
            console.log("Saved new list.");
            res.redirect("/" + customListName);
          })
          .catch(function (err) {
            console.log(err);
          });
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox.trim();
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function (foundItem) {
        return Item.deleteOne({ _id: checkedItemId });
      })
      .then(function () {
        res.redirect("/");
      })
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then(function (foundList) {
      res.redirect("/" + listName);
    });
  }

});


app.get("/about", function (req, res) {
  res.render("about");
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
