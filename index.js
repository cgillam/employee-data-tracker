const inquirer = require("inquirer")
const mysql = require("mysql")
const ctable = require("console.table")


const con = mysql.createConnection({



    host: "localhost",

    port: 3306,
    user: "root",
    password: "",
    database: "employees",
    multipleStatements: true

})
const connect = () => new Promise((resolve, reject) => {
    con.connect((err) => {
        if (err) return reject(err)
        con.query(`
        create table if not exists departments (
            id int auto_increment NOT NULL, name varChar(30), primary key(id)
             
    
        );
        create table if not exists rolls (
            id int auto_increment NOT NULL, title varChar(30), salery decimal, department_id int, primary key(id),  FOREIGN key (department_id) REFERENCES departments(id) on delete cascade
             );
             create table if not exists employees (
                id int auto_increment NOT NULL, first_name varChar(30),  last_name varChar(30), roll_id int, manager_id int, primary key(id), FOREIGN key (roll_id) REFERENCES rolls(id) on delete cascade, FOREIGN key(manager_id) REFERENCES employees(id) on delete set null
                 );
    
    
        `, (err) => {
            if (err) return reject(err)
            connected = true
            resolve()

        })


    })
})

let connected = false
const query = (sql, arguments = undefined) => new Promise(async (resolve, reject) => {
    if (!connected) await connect()
    con.query(sql, arguments, (err, result) => {
        if (err) {
            return reject(err)
        }
        return resolve(result)
    })
})
async function addDepartment() {
    const action = await inquirer.prompt([{
        type: "input",
        message: "enter department name",
        name: "name"
    }])
    if (!action.name) {
        console.log("name.required")
        return



    }
    return query("insert into departments(name) values (?); ", [action.name])





}

async function addEmployee() {
    //  const rollIds = await query("select id from rolls; ").then((results) => results.map(are => are.id))

    const rollIds = (await query("select id from rolls; ")).map(are => are.id)


    const managerids = await new Promise((resolve, reject) => {
        con.query("select id from employees; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })
    const action = await inquirer.prompt([{
        type: "input",
        message: "enter first name",
        name: "firstName"
    }, {
        type: "input",
        message: "enter last name",
        name: "lastName"
    }, {
        type: "list",
        message: "enter roll id ",
        name: "rollId",
        choices: rollIds



    }, {
        type: "list",
        message: "enter manager id ",
        name: "managerId",
        choices: [{ name: "none", value: null }, ...managerids]



    }

    ])

    return new Promise((resolve, reject) => {
        con.query("insert into employees(first_name, last_name, roll_id, manager_id ) values (?,?,?,?); ", [action.firstName, action.lastName, action.rollId, action.managerId], (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result)
        })
    })

}

async function viewEmployee() {
    const employees = await query("select * from employees;")
    console.table(employees)
}
async function viewEmployeesByManager() {
    const employeeIds = await new Promise((resolve, reject) => {
        con.query("select id from employees; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })

    const action = await inquirer.prompt([{
        type: "list",
        message: "enter employee id",
        name: "employeeId",
        choices: employeeIds
    }])

    return new Promise((resolve, reject) => {
        con.query("select * from employees where manager_id = ?;", [action.employeeId], (err, result) => {
            if (err) {
                return reject(err)
            }
            console.table(result)
            if (result.length == 0) console.log("no employees to list")
            return resolve()
        })
    })
}

async function ripEmployee() {
    const employeeIds = await new Promise((resolve, reject) => {
        con.query("select id from employees; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })

    const action = await inquirer.prompt([{
        type: "list",
        message: "enter employee id",
        name: "employeeId",
        choices: employeeIds
    }])

    return new Promise((resolve, reject) => {
        con.query("delete from employees where id = ?;", [action.employeeId], (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}


async function deleteRolls() {
    const rollIds = await new Promise((resolve, reject) => {
        con.query("select id from rolls; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })

    const action = await inquirer.prompt([{
        type: "list",
        message: "enter roll id",
        name: "rollId",
        choices: rollIds
    }])

    return new Promise((resolve, reject) => {
        con.query("delete from rolls where id = ?;", [action.rollId], (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}

async function deleteDep() {
    const departmentsIds = await new Promise((resolve, reject) => {
        con.query("select id from departments; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })

    const action = await inquirer.prompt([{
        type: "list",
        message: "enter department id",
        name: "departmentsId",
        choices: departmentsIds
    }])

    return new Promise((resolve, reject) => {
        con.query("delete from departments where id = ?;", [action.departmentsId], (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}



async function veiwDepartment() {

    return new Promise((resolve, reject) => {
        con.query("select * from departments;", (err, result) => {
            if (err) {
                return reject(err)
            }
            console.table(result)

            return resolve()
        })
    })
}

async function viewRoll() {

    return new Promise((resolve, reject) => {
        con.query("select * from rolls;", (err, result) => {
            if (err) {
                return reject(err)
            }
            console.table(result)

            return resolve()
        })
    })
}


async function addRole() {
    const departmentids = (await query("select id, name from departments; ")).map((department) => {
        return { name: department.name, value: department.id }
    })
    if (departmentids.length == 0) {
        //console.log("no departments found")
        //return
        await addDepartment()
        return addRole()

    }
    const action = await inquirer.prompt([{
        type: "input",
        message: "Enter roll title",
        name: "Title",
        validate: (input) => {
            if (!input) return ("Title required")
            return true
        }
    }, {
        type: "input",
        message: "enter roll salery",
        name: "salery",
        validate: async (input) => {
            if (isNaN(parseFloat(input))) return "salery must be a nuber"
            return true

        }


    }, {
        type: "list",
        message: "chose department ",
        name: "id",
        choices: departmentids



    }

    ])
    return new Promise((resolve, reject) => {
        con.query("insert into rolls(title, salery, department_id) values (?,?,?); ", [action.Title, action.salery, action.id], (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result)
        })
    })




}
async function updateEmployeeRoss() {
    const employeeIds = await new Promise((resolve, reject) => {
        con.query("select id from employees; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })
    const rollIds = await new Promise((resolve, reject) => {
        con.query("select id from rolls; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })
    const action = await inquirer.prompt([

        {
            type: "list",
            message: "enter employee id ",
            name: "employeeId",
            choices: employeeIds



        },
        {
            type: "list",
            message: "enter roll id ",
            name: "rollId",
            choices: rollIds



        }

    ])

    return new Promise((resolve, reject) => {
        con.query("update employees set roll_id = ? where id = ? ; ", [action.rollId, action.employeeId], (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result)
        })
    })




}

async function updateManagerRoss() {
    const employeeIds = await new Promise((resolve, reject) => {
        con.query("select id from employees; ", (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result.map(are => are.id))
        })
    })

    const employee = await inquirer.prompt([

        {
            type: "list",
            message: "enter employee id ",
            name: "employeeId",
            choices: employeeIds
        },

    ])
    const manager = await inquirer.prompt([

        {
            type: "list",
            message: "enter manager id ",
            name: "managerId",
            choices: [{ name: "none", value: null }, ...employeeIds.filter((addId) => {
                return addId != employee.employeeId


            })]
        },

    ])

    return new Promise((resolve, reject) => {
        con.query("update employees set manager_id = ? where id = ? ; ", [manager.managerId, employee.employeeId], (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result)
        })
    })




}


async function functionName() {

    while (true) {
        const action = await inquirer.prompt([{
            type: "list",
            message: "chose an action",
            choices: ["add department", "add role", "add employee", "update employee roll", "update manager roll", "veiw employees by manager", "view department", "view roll", "view employee", "delete employee", "delete department", "delete rolls", "exit"],
            name: "action"
        }])
        if (action.action === "exit") { break }
        switch (action.action) {
            case "add department": await addDepartment()
                break;
            case "add role": await addRole()
                break;
            case "add employee": await addEmployee()
                break;
            case "view department": await veiwDepartment()
                break;
            case "view roll": await viewRoll()
                break;
            case "view employee": await viewEmployee()
                break;
            case "update employee roll": await updateEmployeeRoss()
                break;
            case "update manager roll": await updateManagerRoss()
                break;
            case "veiw employees by manager": await viewEmployeesByManager()
                break;
            case "delete employee": await ripEmployee()
                break;
            case "delete department": await deleteDep()
                break;
            case "delete rolls": await deleteRolls()
                break;
        }

    }
}
functionName().then(() => con.end()).catch(
    (err) => {
        con.end()
        console.error(err)
    })