// **************
// **  Models  **
// **************
const db = require("../db.js");
const bcrypt = require("bcrypt");
const axios = require("axios");
exports.getAdPage = (req, res, next) => {
  const q = "SELECT `cityID`, `smartKey`, `solutionID`, `solutionName`, `Source_funds`, `funds`, `start_year`, `end_year`, `status`FROM `solution` WHERE 1";
  db.query(q, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    // สร้างอาร์เรย์เพื่อเก็บค่าจำนวนของแต่ละสถานะของ status
    let statusCounts = {
      status: {
        0: 0,
        1: 0,
        2: 0
      }
    };

    // วนลูปผ่านข้อมูลที่ได้จากการ query
    data.forEach(element => {
      // นับจำนวนของแต่ละสถานะของ status
      statusCounts.status[element.status]++;

    });

    // แสดงผลลัพธ์ในคอนโซล
    // console.log("จำนวน status:", statusCounts.status);

    // ส่งข้อมูลไปยังหน้าแสดงผล
    res.render("admin/ad-main", {
      pageTitle: "Main",
      path: "/",
      data: data,
      statusCounts: statusCounts
    });
  });
};





exports.notification = (req, res, next) => {
  // ส่วนของ Token ที่ได้จากการสร้างของแอปไลน์ Notify
  // const CityID = req.params.CityID;
  const CityID = '6201ECO01'

  const q = "SELECT citydata.province,solution.solutionName FROM `solution` JOIN citydata ON solution.cityID=citydata.cityID WHERE solution.solutionID=?";
  try {
    db.query(q, [CityID], (err, data) => {
      // console.log(data)
      if (err) return res.status(500).json(err);
      const LINE_NOTIFY_TOKEN = "npl7B2crirxxrRoFmq3KFSNaR2xjGH4Ixn9G0KOUNDf";

      // ส่วนของข้อความที่ต้องการส่ง
      const message = "จังหวัด" + data[0].province + data[0].solutionName + "ส่งฟรอมแล้วนะขอรับท่านพี่เค้ก";

      // URL ของ API สำหรับการส่งข้อความผ่าน Line Notify
      const LINE_NOTIFY_API_URL = "https://notify-api.line.me/api/notify";

      // ส่งข้อความผ่าน Line Notify API
      axios
        .post(LINE_NOTIFY_API_URL, `message=${message}`, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
          },
        })
        .then((response) => {
          // console.log("Notification sent:", response.data);
          res.status(200).json({ message: "Notification sent successfully" });
        })
        .catch((error) => {
          console.error("Error sending notification:", error);
          res.status(500).json({ error: "Failed to send notification" });
        });
    });
  }
  catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getHistoryPage = (req, res, next) => {
  q = "SELECT * FROM `Login_log` ORDER BY `Login_ID` DESC;"
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    // console.log(data);
    res.render("admin/ad-city/ad-History", {
      pageTitle: "History",
      path: "/",
      data: data,
    });
  });
};
//get city ad-city
exports.getAdCityP = (req, res, next) => {
  const q =
    "SELECT `cityID`, `province`, `date`, `developer`, `executive`, `government_investment`, `private_investment`,`LAT`, `LNG` FROM `citydata` WHERE 1";
  try {
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log(data);
      res.render("admin/ad-city/ad-city", {
        req,
        pageTitle: "Dashboard",
        path: "/city",
        cityData: data,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
exports.getAdCityDataP = (req, res, next) => {
  try {
    const q = "SELECT * FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?;";
    const q2 = "SELECT * FROM `solution` JOIN smart ON solution.smartKey=smart.smartKey WHERE solution.cityID=? AND solution.status_solution=1 ORDER BY `solution`.`smartKey` ASC";
    const q3 = "SELECT `smartKey`,`Progress`,`solutionName` FROM `solution` WHERE cityID=? ";
    const q4 = "SELECT anssolution.ans FROM `anssolution` JOIN `solution` ON anssolution.solutionID = solution.solutionID WHERE anssolution.questionID = '5' AND solution.cityID = ?;";
    
    db.query(q, [req.params.cityID], (err, data) => {
      if (err) return res.status(500).json(err);

      db.query(q2, [req.params.cityID], (errer, solution) => {
        if (errer) return res.status(500).json(errer);

        db.query(q3, [req.params.cityID], (err, countsmart) => {
          if (err) return res.status(500).json(err);

          db.query(q4, [req.params.cityID], (err, result) => {
            if (err) return res.status(500).json(err);

            // คำนวณเปอร์เซ็นต์ของปัญหา โดยกรองค่าที่เป็น null ออก
            const validProblems = result.filter(row => row.ans !== 'null');
            const totalProblems = validProblems.length;
            const problemCounts = {};

            validProblems.forEach(row => {
              if (problemCounts[row.ans]) {
                problemCounts[row.ans]++;
              } else {
                problemCounts[row.ans] = 1;
              }
            });

            const problemPercentages = Object.keys(problemCounts).map(key => {
              return {
                problem: key,
                percentage: ((problemCounts[key] / totalProblems) * 100).toFixed(2)
              };
            });

            // โค้ดเดิมที่คำนวณ progress และ success
            const smartKeyCounts = {};
            const projectSuccess = [];
            const successfulProjectsData = Array(8).fill(0); // Initialize an array for successful projects
            const unsuccessfulProjectsData = Array(8).fill(0); // Initialize an array for unsuccessful projects
            let n = 0;
            let totalProgress = 0;
            let completeCount = 0;

            countsmart.forEach(row => {
              if (smartKeyCounts[row.smartKey]) {
                smartKeyCounts[row.smartKey]++;
              } else {
                smartKeyCounts[row.smartKey] = 1;
              }
              if (row.Progress == 100) {
                completeCount++;
                projectSuccess.push(row.solutionName);
                successfulProjectsData[Object.keys(smartKeyCounts).indexOf(row.smartKey)]++;
              } else {
                unsuccessfulProjectsData[Object.keys(smartKeyCounts).indexOf(row.smartKey)]++;
              }
              totalProgress += row.Progress;
              n++;
            });

            // คำนวณค่าเฉลี่ยของความคืบหน้าสำหรับแต่ละ smartKey
            const smartKeyProgress = {};
            const smartKeyCountsForAverage = {};

            countsmart.forEach(item => {
              if (smartKeyProgress[item.smartKey]) {
                smartKeyProgress[item.smartKey] += item.Progress;
                smartKeyCountsForAverage[item.smartKey] += 1;
              } else {
                smartKeyProgress[item.smartKey] = item.Progress;
                smartKeyCountsForAverage[item.smartKey] = 1;
              }
            });

            const averageProgressPerSmartKey = {};
            Object.keys(smartKeyProgress).forEach(key => {
              averageProgressPerSmartKey[key] = (smartKeyProgress[key] / smartKeyCountsForAverage[key]).toFixed(2);
            });
        

            const averageProgress = n > 0 ? (totalProgress / n).toFixed(0) : 0;
            const complete = completeCount;
            const count = n;

            res.render("admin/ad-city/ad-citydata", {
              req,
              pageTitle: "Dashboard",
              path: "/city",
              cityData: data[0],
              solution: solution,
              smartKeyCounts: smartKeyCounts,
              totalProgress: averageProgress,
              averageProgressPerSmartKey: averageProgressPerSmartKey, // ส่งค่าเฉลี่ยของ progress ไปยัง template
              complete: complete,
              count: count,
              projectSuccess: projectSuccess,
              successfulProjectsData: JSON.stringify(successfulProjectsData), // Stringify the arrays
              unsuccessfulProjectsData: JSON.stringify(unsuccessfulProjectsData), // Stringify the arrays
              problemPercentages: problemPercentages, // ส่งข้อมูลเปอร์เซ็นต์ของปัญหาไปยัง template
            });
          });
        });
      });
    });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};






exports.getAddCity = (req, res, next) => {
  res.render("admin/ad-city/ad-addCity", {
    pageTitle: "add",
    path: "/",
    success: false,
  });
};
exports.postAddCity = (req, res, next) => {
  const {
    cityID,
    province,
    cityName,
    date,
    developer,
    executive,
    government_investment,
    private_investment,
    username,
    password,
    password2,
    LAT,
    LNG,
  } = req.body;
  db.query("SELECT * FROM admininfo WHERE AdminUsername = ?", [username], (adminUsernameError, adminUsernameResult) => {
    if (adminUsernameError) {
      console.error("Error checking admin username:", adminUsernameError);
      return res.status(500).send("Internal Server Error");
    }

    if (adminUsernameResult.length > 0) {
      // Admin username already exists
      return res.status(400).send("Admin username already exists");
    }
    db.query("SELECT * FROM citydata WHERE username = ?", [username], (usernameError, usernameResult) => {
      if (usernameError) {
        console.error("Error checking username:", usernameError);
        return res.status(500).send("Internal Server Error");
      }

      if (usernameResult.length > 0) {
        // Username already exists
        return res.status(400).send("Username already exists");
      }
      // ใช้ bcrypt เพื่อเข้ารหัส password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing password:", err);
          return res.status(500).send("Internal Server Error");
        }

        // ทำสิ่งที่ต้องการด้วย hashedPassword ที่เข้ารหัสแล้ว
        // console.log("Hashed Password:", hashedPassword);

        // เตรียมข้อมูลสำหรับการเพิ่มเข้าฐานข้อมูล
        const cityData = {
          cityID,
          province,
          date,
          developer,
          executive,
          government_investment,
          private_investment,
          username,
          password: hashedPassword, // ใช้รหัสที่เข้ารหัสแล้ว
          LAT,
          LNG,
        };

        // เพิ่มข้อมูลลงในตาราง citydata
        db.query("INSERT INTO citydata SET ?", cityData, (error, result) => {
          if (error) {
            console.error("Error inserting city data:", error);
            return res.status(500).send("Internal Server Error");
          }
          console.log("City data added successfully");

          // เตรียมข้อมูลสำหรับการเพิ่มข้อมูลลงในตาราง city_home
          const cityHomeData = {
            cityID,
            cityName,
          };

          // เพิ่มข้อมูลลงในตาราง city_home
          db.query(
            "INSERT INTO city_home SET ?",
            cityHomeData,
            (homeError, homeResult) => {
              if (homeError) {
                console.error("Error inserting city home data:", homeError);
                return res.status(500).send("Internal Server Error");
              }
              console.log("City home data added successfully");

              // ตอบกลับหลังจากทำการเพิ่มข้อมูลทั้งสองตารางแล้ว
              // res.status(200).redirect("admin/ad-city/ad-addCity?success=true");
              // res.status(200).send("succesfully");
              res.render("admin/ad-city/ad-addCity", {
                pageTitle: "add",
                path: "/",
                success: true,
              });
            }
          );
        });
      });
    });
  });
};

exports.getEditProvince = (req, res, next) => {
  // console.log(req.params);
  const q =
    "SELECT citydata.cityID, citydata.province, citydata.date, citydata.developer, citydata.executive, citydata.government_investment, citydata.private_investment, citydata.LAT, citydata.LNG FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?;";
  try {
    db.query(q, [req.params.cityID], (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("Data is:", data);
      res.render("admin/ad-city/ad-editCity", {
        req,
        pageTitle: "Dashboard",
        path: "/city",
        cityData: data[0],
        success: false,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
exports.postUpdateProvince = (req, res, next) => {
  const cityID = req.params.cityID;
  const newData = req.body;
  delete newData._csrf;
  // SQL query for updating data
  const query = "UPDATE citydata SET ? WHERE cityID = ?";

  // Execute the query
  db.query(query, [newData, cityID], (err, result) => {
    if (err) {
      console.error("Error updating data:", err);
      return res
        .status(500)
        .json({ error: "An error occurred while updating data" });
    }
    console.log("Data updated successfully");
    //fix later
    exports.getAdCityDataP(req, res, next);
  });
};

exports.getAddSolutionPage = (req, res, next) => {
  // console.log(req.params);
  res.render("admin/ad-city/ad-addsolution", {
    pageTitle: "add",
    path: "/",
    success: true,
    cityID: req.params.cityID,
  });
};

exports.postAddSolution = (req, res, next) => {
  const {
    cityID,
    solutionID,
    solutionName,
    smart,
    sourceFunds,
    funds,
    startYear,
    endYear,
    status,
  } = req.body;

  let smartKey;
  switch (smart) {
    case "Environment":
      smartKey = "ENV"; // สมมติว่า 'ENV' คือค่าที่สมบูรณ์กับ 'Environment'
      break;
    case "Energy":
      smartKey = "ENE";
      break;
    case "Economy":
      smartKey = "ECO";
      break;
    case "Governance":
      smartKey = "GOV";
      break;
    case "Living":
      smartKey = "LIV";
      break;
    case "Mobility":
      smartKey = "MOB";
      break;
    case "People":
      smartKey = "PEO";
      break;
    default:
      smartKey = "OTH"; // สมมติว่า 'OTH' คือค่าที่สมบูรณ์กับ 'Others' หรือค่าที่ไม่เข้าข่ายข้างต้น
      break;
  }
  const q = "INSERT INTO `solution`(`cityID`, `smartKey`, `solutionID`, `solutionName`, `Source_funds`, `funds`, `start_year`, `end_year`, `status`,`status_solution`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,'1')";
  db.query(q, [cityID, smartKey, solutionID, solutionName, sourceFunds, funds, startYear, endYear, status,], (err, result) => {
    if (err) {
      console.error("Error adding solution:", err);
      res.status(500).json({ error: "Error adding solution" });
    } else {
      // console.log("Solution added successfully");
      // res.status(200).json({ message: "Solution added successfully" });
      const q1 = "SELECT * FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?;";
      const q2 = "SELECT * FROM `solution`JOIN smart ON solution.smartKey=smart.smartKey WHERE solution.cityID=? AND solution.status_solution=1 ORDER BY `solution`.`smartKey` ASC";

      db.query(q1, [cityID], (err, data) => {
        if (err) return res.status(500).json(err);
        // console.log("Data is:", data);
        db.query(q2, [cityID], (errer, solution) => {
          if (err) return res.status(500).json(errer);
          res.render("admin/ad-city/ad-citydata", {
            req,
            pageTitle: "Dashboard",
            path: "/city",
            cityData: data[0],
            solution: solution,
          });
        });
      });
      //here
    }
  }
  );
};

exports.getEditSolution = (req, res, next) => {
  // console.log(req.params);
  const q = "SELECT * FROM `solution` WHERE solutionID=?";
  try {
    db.query(q, [req.params.solutionID], (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("Data is:", data);
      res.render("admin/ad-city/ad-editSolution", {
        req,
        pageTitle: "Edit_Solution",
        path: "/Edit_Solution",
        cityData: data[0],
        solutionID: req.params.solutionID,
        success: false,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getQuestion = (req, res, next) => {
  const q = "SELECT * FROM `question` WHERE 1";
  try {
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("data:", data);
      res.render("admin/ad-question/ad-question.ejs", {
        req,
        pageTitle: "Question",
        path: "/Question",
        data: data,
        success: false,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getAddQuestion = (req, res, next) => {
  const q = "INSERT INTO `question`(`question`) VALUES (?)";
  const newQuestion = req.body.New_Question;

  try {
    db.query(q, [newQuestion], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      const q1 = "SELECT * FROM `question` WHERE 1";
      db.query(q1, (err, data) => {
        if (err) return res.status(500).json(err);
        res.render("admin/ad-question/ad-question.ejs", {
          req,
          pageTitle: "Question",
          path: "/Question",
          data: data,
          success: true,
        });
      });

    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};
exports.postDeleteQuestion = (req, res, next) => {
  q = "DELETE FROM `question` WHERE questionID=?";
  db.query(q, [req.params.QID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    const q = "SELECT * FROM `question` WHERE 1";
    db.query(q, (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log("data:", data);
      res.render("admin/ad-question/ad-question.ejs", {
        req,
        pageTitle: "Question",
        path: "/Question",
        data: data,
        success: false,
      });
    });
  });
};

exports.getkpi = (req, res, next) => {
  const solutionID = req.params.solutionID
  const q1 = "SELECT * FROM `kpi` WHERE solutionID=?"
  db.query(q1, [solutionID], (err, kpi) => {
    if (err) return res.status(500).json(err);
    // console.log(kpi)
    res.render("admin/ad-city/ad-kpi.ejs", {
      req,
      solutionID: solutionID,
      kpi: kpi,
      pageTitle: "KPI",
      path: "/KPI",

    });
  })

}
exports.postkpi = (req, res, next) => {
  // ดึงข้อมูลจาก req.body
  const data = req.body;

  // ดึงข้อมูล solutionID จาก req.params
  const solutionID = req.params.solutionID;

  // ตรวจสอบว่าข้อมูลถูกส่งมาให้หรือไม่
  if (!data || !solutionID) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
  }

  const q = "UPDATE kpi SET kpiName=?, goal=?, unit=? WHERE kpiID=?";

  // วนลูปเพื่ออัปเดตข้อมูล KPI ในฐานข้อมูล
  Object.keys(data).forEach((key) => {
    if (key.startsWith('type')) {
      const kpiID = key.replace('type_', ''); // ดึง kpiID จากชื่อ key
      const kpiName = data[`name${kpiID}`]; // ดึงชื่อ KPI จาก data
      const unit = data[`unit${kpiID}`]; // ดึงหน่วยนับของ KPI จาก data
      const goal = data[`goal_${kpiID}`] || 0; // หากไม่มี goal ให้ใช้ค่าเริ่มต้นเป็น 0
      // console.log("kpiID:"+kpiID)
      // console.log("kpiName:"+kpiName)
      // console.log("unit:"+unit)
      // console.log("goal:"+goal)

      // Execute the SQL query
      db.query(q, [kpiName, goal, unit, kpiID], (err, result) => {
        // console.log(result)

        if (err) {
          console.error(`Error updating KPI ${kpiID}:`, err);
        } else {
          // console.log(`Updated KPI ${kpiID} with solutionID ${solutionID}:`, { kpiID, kpiName, goal, unit });
        }
      });
    }
  });

  // ส่งคำตอบกลับ
  // res.status(200).json({ message: 'อัปเดตข้อมูล KPI สำเร็จ' });
  res.redirect('/admin/city');
};


exports.deleteSolution = (req, res, next) => {
  // console.log(req.params);

  try {
    const q3 = "UPDATE `solution` SET `status_solution`='0' WHERE solutionID=? ORDER BY `solution`.`smartKey` ASC"
    db.query(q3, [req.params.solutionID], (err, deletedata) => {
      if (err) return res.status(500).json(err);
      res.redirect(`/admin/city/${req.params.cityID}`);
    })
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};
exports.updateSolution = (req, res, next) => {
  // console.log(req.body);

  const { cityID, smart, solutionName, sourceFunds, funds, startYear, endYear, _csrf } = req.body;
  const solutionID = req.params.solutionID; // Assumes you have solutionID in the params

  let smartKey;
  switch (smart) {
    case "Environment":
      smartKey = "ENV"; // สมมติว่า 'ENV' คือค่าที่สมบูรณ์กับ 'Environment'
      break;
    case "Energy":
      smartKey = "ENE";
      break;
    case "Economy":
      smartKey = "ECO";
      break;
    case "Governance":
      smartKey = "GOV";
      break;
    case "Living":
      smartKey = "LIV";
      break;
    case "Mobility":
      smartKey = "MOB";
      break;
    case "People":
      smartKey = "PEO";
      break;
    default:
      smartKey = "OTH"; // สมมติว่า 'OTH' คือค่าที่สมบูรณ์กับ 'Others' หรือค่าที่ไม่เข้าข่ายข้างต้น
      break;
  }

  const q3 = "UPDATE `solution` SET `smartKey`=?, `solutionName`=?, `Source_funds`=?, `funds`=?, `start_year`=?, `end_year`=?, `status_solution`='1' WHERE `solutionID`=?";
  const q = "SELECT * FROM citydata JOIN city_home ON citydata.cityID = city_home.cityID WHERE citydata.cityID = ?;";
  const q2 = "SELECT * FROM `solution` JOIN smart ON solution.smartKey=smart.smartKey WHERE cityID=? AND status_solution=1 ORDER BY `solution`.`smartKey` ASC";

  try {
    db.query(q3, [smartKey, solutionName, sourceFunds, funds, startYear, endYear, solutionID], (err, result) => {
      if (err) return res.status(500).json(err);

      db.query(q, [cityID], (err, data) => {
        if (err) return res.status(500).json(err);

        db.query(q2, [cityID], (errer, solution) => {
          if (errer) return res.status(500).json(errer);
          // console.log(solution)
          res.render("admin/ad-city/ad-citydata", {
            req,
            pageTitle: "Dashboard",
            path: "/city",
            cityData: data[0],
            solution: solution,
          });
        });
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.getRoundPage = (req, res, next) => {
  const q1 = "SELECT DISTINCT `date` FROM `citydata`";
  db.query(q1, (err, dates) => {
    if (err) return res.status(500).json(err);

    // แปลงวันที่ให้อยู่ในรูปแบบที่ต้องการในภาษาไทย
    const formattedDates = dates.map(item => {
      const date = new Date(item.date);
      return {
        original: item.date,
        formatted: date.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    });
    res.render("admin/ad-city/ad-round", {
      req,
      pageTitle: "round",
      path: "/round",
      dates: formattedDates
    });
  });
};
exports.postRound = (req, res, next) => {
  const { open, close, _csrf, ...dates } = req.body;

  for (const [date, round] of Object.entries(dates)) {
      if (date === '_csrf') continue;

      const formattedDate = new Date(date).toISOString().split('T')[0];

      const selectSql = "SELECT COUNT(*) as count FROM `Round` WHERE `Date` = ?";
      db.query(selectSql, [formattedDate], (selectErr, selectResult) => {
          if (selectErr) {
              console.error(selectErr);
              return res.status(500).send('Internal Server Error');
          }

          const count = selectResult[0].count;
          if (count > 0) {
              // If date exists, update the record
              const updateSql = "UPDATE `Round` SET `open` = ?, `close` = ?, `round` = ? WHERE `Date` = ?";
              const updateValues = [open, close, round, formattedDate];
              db.query(updateSql, updateValues, (updateErr, updateResult) => {
                  if (updateErr) {
                      console.error(updateErr);
                      return res.status(500).send('Internal Server Error');
                  }
                  console.log(`Updated round for date: ${formattedDate}`);
              });
          } else {
              // If date does not exist, insert a new record
              const insertSql = "INSERT INTO `Round` (`Date`, `open`, `close`, `round`) VALUES (?, ?, ?, ?)";
              const insertValues = [formattedDate, open, close, round];
              db.query(insertSql, insertValues, (insertErr, insertResult) => {
                  if (insertErr) {
                      console.error(insertErr);
                      return res.status(500).send('Internal Server Error');
                  }
                  console.log(`Inserted round for date: ${formattedDate}`);
              });
          }
      });
  }

  res.redirect('/admin/city');
}

