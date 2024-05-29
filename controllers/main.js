const db = require("../db.js");

// Display the Welcome Page
exports.getWelcomePage = (req, res, next) => {
  res.render("welcome", { req, pageTitle: "Welcome", path: "/welcome" });
};

// Display the Main Page
exports.getMainPage = (req, res, next) => {
  const q = "SELECT city_home.cityName, citydata.province, citydata.date FROM `city_home` JOIN citydata ON city_home.cityID = citydata.cityID ;"
  db.query(q,(err,data)=>{
    if(err) return res.status(500).json("queryError",err);
    res.render("main", { req, 
      pageTitle: "", 
      path: "/home",
      fechdata:data 
    });

  })
  
};
