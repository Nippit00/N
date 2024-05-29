const db = require("../db.js");

// ****************
// **  getCity   **
// ****************
exports.GetCity = (req, res) => {
  const cityID = req.session.userID;
  const qCityData =
    "SELECT * FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?";
  const qSolution =
    "SELECT `smartKey` FROM `solution` WHERE cityID=? ";
  const qCityFile =
    "SELECT * FROM cityfile WHERE cityfile.cityID = ?";
  try {
    db.query(qCityData, [cityID], (err, cityData) => {
      if (err) return res.status(500).json(err);
      db.query(qSolution, [cityID], (err, solutionData) => {
        if (err) return res.status(500).json(err);

        const smartKeyCounts = {};
        solutionData.forEach(row => {
          if (smartKeyCounts[row.smartKey]) {
            smartKeyCounts[row.smartKey]++;
          } else {
            smartKeyCounts[row.smartKey] = 1;
          }
        });

        db.query(qCityFile, [cityID], (err, cityFileData) => {
          if (err) return res.status(500).json(err);

          res.render("city/city", {
            req,
            pageTitle: cityData[0].cityname,
            path: "/city",
            cityInfo: cityData[0],
            citysolution: solutionData,
            smartKeyCounts: smartKeyCounts,// ส่งจำนวน smart key แต่ละตัวในออบเจกต์ไปยัง view
            datafile: cityFileData
          });
        });
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};



exports.getCityDashboard = (req, res, next) => {
  const cityID = req.session.userID;
  const q = "SELECT * FROM solution JOIN smart ON solution.smartKey = smart.smartKey JOIN kpi ON kpi.solutionID = solution.solutionID JOIN citydata ON citydata.cityID = solution.cityID WHERE solution.cityID = ? GROUP BY solution.solutionID";
  const qGetvalue = "SELECT * FROM anssolution JOIN solution ON anssolution.solutionID = solution.solutionID WHERE anssolution.solutionID = ?"
  try {
    db.query(q, [cityID], (err, data) => {
      if (err) return res.status(500).json(err);

      const dataUpdate = data.map(row => {
        return {
          ...row,
          status: JSON.parse(row.status)
        };
      });

      db.query(qGetvalue, [cityID], (err, value) => {
        // console.log(value)
        if (err) return res.status(500).json(err);
        res.render("city/dashboard", {
          req,
          pageTitle: "Dashboard",
          path: "/city",
          solutionInfo: JSON.stringify(dataUpdate),
          data: data,
          valueInfo: value,
        });
      })
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getCityFollow = (req, res, next) => {
  const cityID = req.session.userID;
  const q = "SELECT * FROM solution JOIN smart ON solution.smartKey = smart.smartKey JOIN kpi ON kpi.solutionID = solution.solutionID JOIN city_home ON city_home.cityID = solution.cityID WHERE solution.cityID = ? AND solution.status_solution=1 GROUP BY solution.solutionName ORDER BY solution.solutionID ASC";
  try {
    db.query(q, [cityID], (err, data) => {
      // console.log("Check follow data :",data)
      const followdata = data.map(row => {
        return {
          ...row,
          status: JSON.parse(row.status)
        };
      });
      // console.log(followdata)
      res.render("city/follow", {
        pageTitle: "Follow",
        path: "/city",
        followdata: followdata || [],
      });
    });

  } catch (err) {
    console.log(err);
    res.status(500).json(err)
  }
};

exports.getCityUpload = (req, res, next) => {
  // Render the /upload page
  res.render("city/upload", {
    pageTitle: "Upload",
    path: "/city",
  });
};

exports.getHistory = (req, res, next) => {
  q = "SELECT * FROM `Login_log` WHERE cityID = ?";
  // console.log(req.session.cityID)
  db.query(q, [req.session.userID], (err, data) => {
    if (err) return res.status(500).json(err);
    res.render("city/history-log", {
      pageTitle: "History",
      path: "/",
      data: data,
    });
  });
}