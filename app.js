const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");

// Set up default mongoose connection
mongoose.connect(
  "mongodb+srv://admin-yarden:yarden1169@cluster0.7batslt.mongodb.net/todolistDB"
);

// Mongoose Schema for individual to-do list items
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your TO DO LIST",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<---- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

// Mongoose Schema for custom lists
const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

// Default route for the home page
app.get("/", function (req, res) {
  Item.find({}) // Find all items in the collection
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems) // Insert default items if the collection is empty
          .then(() => {
            console.log("Default items inserted");
            res.redirect("/"); // Redirect to the home page to display the default items
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        // Render the home page and pass the found items
        res.render("list.ejs", {
          listTitle: "Today",
          newListItems: foundItems,
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

// Route for adding new items
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // Check if itemName is not an empty string
  if (itemName.trim() !== "") {
    const item = new Item({
      // Create a new item based on the input
      name: itemName,
    });

    if (listName === "Today") {
      // Save the item to the default collection
      item.save();
      res.redirect("/");
    } else {
      // Find the custom list and push the new item
      List.findOne({ name: listName })
        .then((foundItems) => {
          foundItems.items.push(item);
          foundItems.save();
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } else {
    if (listName === "Today") {
      res.redirect("/");
    } else {
      List.findOne({ name: listName })
        .then((foundItems) => {
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
});

// Route for deleting items
app.post("/delete", function (req, res) {
  console.log(req.body.name + " deleted");
  const listName = req.body.listName;
  const checkItemId = req.body.checkbox;

  // Delete the item from the default collection
  if (listName === "Today") {
    deleteCheckedItem();
  } else {
    // Find the custom list and pull the item from the array
    deleteCustomItem();
  }

  async function deleteCheckedItem() {
    try {
      await Item.deleteOne({ _id: checkItemId });
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  }

  async function deleteCustomItem() {
    try {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkItemId } } }
      );
      res.redirect("/" + listName);
    } catch (err) {
      console.error(err);
    }
  }
});

// Custom route for dynamic lists
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }) // Find a list with the custom list name
    .then((foundList) => {
      if (!foundList) {
        // Create a new list if it doesn't exist
        console.log("Creating new list");
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        console.log("saved the new list");
        res.redirect("/" + customListName);
      } else {
        // Render the existing custom list
        console.log("Exists !");
        res.render("list.ejs", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// About Page
app.get("/about", function (req, res) {
  res.render("about");
});

// Start the server at Port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
