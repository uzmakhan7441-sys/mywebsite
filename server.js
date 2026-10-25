const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const dataFolder = path.join(__dirname, "data");
const startupsFile = path.join(dataFolder, "startups.json");
const messagesFile = path.join(dataFolder, "messages.json");

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}

function createFile(file, initialData) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(initialData, null, 2));
  }
}

createFile(startupsFile, []);
createFile(messagesFile, []);

function readData(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function clean(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/startups", (req, res) => {
  let startups = readData(startupsFile);
  const search = clean(req.query.search, 100).toLowerCase();

  if (search) {
    startups = startups.filter(s =>
      [s.name, s.owner, s.category, s.village, s.description]
        .some(value => String(value).toLowerCase().includes(search))
    );
  }

  res.json(startups);
});

app.post("/api/startups", (req, res) => {
  const { name, owner, category, village, description, contact } = req.body;

  if (![name, owner, category, village, description, contact]
      .every(value => clean(value))) {
    return res.status(400).json({ error: "Please fill all fields." });
  }

  const startups = readData(startupsFile);

  const startup = {
    id: Date.now(),
    name: clean(name, 100),
    owner: clean(owner, 100),
    category: clean(category, 80),
    village: clean(village, 100),
    description: clean(description, 600),
    contact: clean(contact, 120),
    date: new Date().toISOString()
  };

  startups.unshift(startup);
  saveData(startupsFile, startups);

  res.status(201).json({
    message: "Startup registered successfully!",
    startup
  });
});

app.delete("/api/startups/:id", (req, res) => {
  const startups = readData(startupsFile);
  const updated = startups.filter(
    s => String(s.id) !== String(req.params.id)
  );

  if (updated.length === startups.length) {
    return res.status(404).json({ error: "Startup not found." });
  }

  saveData(startupsFile, updated);
  res.json({ message: "Startup deleted successfully." });
});

app.post("/api/messages", (req, res) => {
  const { name, email, topic, message } = req.body;

  if (![name, email, topic, message].every(value => clean(value))) {
    return res.status(400).json({ error: "Please fill all fields." });
  }

  const messages = readData(messagesFile);

  messages.unshift({
    id: Date.now(),
    name: clean(name, 100),
    email: clean(email, 120),
    topic: clean(topic, 100),
    message: clean(message, 1000),
    date: new Date().toISOString()
  });

  saveData(messagesFile, messages);

  res.status(201).json({
    message: "Your enquiry has been saved successfully."
  });
});

app.get("/api/messages", (req, res) => {
  res.json(readData(messagesFile));
});

app.get("/api/resources", (req, res) => {
  res.json([
    {
      title: "Digital Marketing",
      description: "Learn how to promote your products online.",
      category: "Marketing"
    },
    {
      title: "Product Photography",
      description: "Take clear product photos using your mobile phone.",
      category: "Digital Skills"
    },
    {
      title: "Online Payment Safety",
      description: "Protect your UPI PIN, OTP and banking details.",
      category: "Online Safety"
    },
    {
      title: "Business Record Keeping",
      description: "Track daily sales, expenses and profits.",
      category: "Business"
    }
  ]);
});

app.listen(PORT, () => {
  console.log('Website running at http://localhost:${PORT}');
});