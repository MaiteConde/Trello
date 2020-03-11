const getLocalStorageColumns = () => localStorage.getItem('columns') ?
    JSON.parse(localStorage.getItem('columns')) : [];
//aquí leemos el localStorage por si hay columnas previas, en caso de no haber se convierte en null, y la variable columns para a ser array vacia [].
const columns = getLocalStorageColumns();
//renderizamos en el DOM columnas de haberlas en el localStorage.

const changeTitleLocalStorage = (title, columnId) => {
    const columns = getLocalStorageColumns();
    const currentColumn = columns.find(column => columnId === column.id);
    currentColumn.title = title;
    localStorage.setItem('columns', JSON.stringify(columns));
}
const changeColumnTitleBlur = (event, columnId) => {
    changeTitleLocalStorage(event.target.innerText, columnId)
}
const changeColumnTitleEnter = (event, columnId) => {
    if (event.key === 'Enter') {
        changeTitleLocalStorage(event.target.value, columnId);
        event.target.blur();
    }
}
const restoreOpacity =Node => {//al ser de tipo NodeList lo que obtenemos en geElements... debemos castearlo a array para poder iterarla con un forEach y añadir a cada nodo el listener dragend
    Node.addEventListener("dragend", function (event) {
        event.target.style.opacity = "1";
    })
}
const renderColumns = (columns) => {
    document.querySelector('main').innerHTML = '';
    columns.forEach(column => {
        if(!column) return;
        let tasks = ``
        //iteramos a través de las tareas para ir concatenando los divs task por cada una de las tareas existentes en la columna
        column.tasks.forEach(task => {
            tasks += `<div class="task" id="${task.id}" draggable ondragstart ="drag(event,${task.id})" >
            <h5>${task.title}</h5>
            <i class="far fa-trash-alt" onclick="removeTask(${task.id})"></i>
        </div>`
        })
        document.querySelector('main').innerHTML += `<div class="column" 
            id="${column.id}" draggable='true' ondragstart='dragColumn(event);'>
            
                    <div class="tituloColumna">
                        <h2 contentEditable onkeydown="preventEnter(event)" onkeyup="changeColumnTitleEnter(event,${column.id})" onBlur="changeColumnTitleBlur(event,${column.id})">${column.title}</h2>
                        <i class="far fa-trash-alt" onclick="removeColumn(${column.id})"></i>
                    </div>
                        <div class="tasks" ondragover="preventDefault(event)"  ondrop="drop(event)">
                        ${tasks}
                        </div>
                        <input type="text" onkeyup="addTask(event,${column.id})">
                        </div>`

    });
    Array.from(document.getElementsByClassName("column")).forEach(restoreOpacity)
    Array.from(document.getElementsByClassName("task")).forEach(restoreOpacity)
    return columns
}
renderColumns(columns)
const removeTaskFromLocalStorage = (taskId, columnId) => {
    const columns = getLocalStorageColumns();
    const currentColumn = columns.find(column => column.id == columnId);
    const tasksFiltered = currentColumn.tasks.filter(task => task.id !== +taskId);
    currentColumn.tasks = tasksFiltered;
    localStorage.setItem('columns', JSON.stringify(columns));
    return columns;
}
const removeTask = (taskId) => {
    const currentColumnId = document.getElementById(taskId).parentElement.parentElement.id;
    removeTaskFromLocalStorage(taskId, currentColumnId)
    document.getElementById(taskId).remove();
    // agregar que tambien se borren del local storage
}

const removeColumnFromLocalStorage = (columnId) => {
    const columns = getLocalStorageColumns();
    const columnsFiltered = columns.filter(column => column.id !== +columnId);
    localStorage.setItem('columns', JSON.stringify(columnsFiltered));
}

const removeColumn = (columnId) => {
    document.getElementById(columnId).remove();
    removeColumnFromLocalStorage(columnId)
}

const addTask = (event, columnId) => {
    if (event.key === 'Enter') {
        const taskId = Date.now();
        document.getElementById(columnId).children[1].innerHTML += `
        <div class="task" id="${taskId}" draggable ondragstart ="drag(event,${taskId})" >
            <h5>${event.target.value}</h5>
            <i class="far fa-trash-alt" onclick="removeTask(${taskId})"></i>
        </div>`

        const columns = getLocalStorageColumns();
        //buscamos la columna en la cual se este creando la tarea
        const currentColumn = columns.find(column => column.id === columnId);
        //añadimos la tarea al array tasks de la columna en la que estamos
        currentColumn.tasks.push({
            id: taskId,
            title: event.target.value
        });
        //sobreescribo todas las columnas porque las strings en JS son inmutables
        localStorage.setItem('columns', JSON.stringify(columns));
        event.target.value = '';
    }
}
const preventDefault = event => event.preventDefault();
const preventEnter = event => event.key === 'Enter' ? event.preventDefault() : '';

const drag = (event, taskId) => {
    event.dataTransfer.setData("id", taskId);
    const columnId = event.target.parentElement.parentElement.id;
    event.dataTransfer.setData("columnId", columnId);

}

const drop = event => {
    const taskId = event.dataTransfer.getData("id");
    const oldColumnId = event.dataTransfer.getData("columnId");
    const task = document.getElementById(taskId);
    if (event.target.classList.contains('tasks') && task) {
        event.target.appendChild(task)
        const newColumnId = event.target.parentElement.id;
        let columns = getLocalStorageColumns();
        const taskObj = columns.flatMap(column => column? column.tasks:[]).find(task => task.id === +taskId);
        columns = removeTaskFromLocalStorage(taskId, oldColumnId);
        columns.find(column => column.id === +newColumnId).tasks.push(taskObj);
        localStorage.setItem("columns", JSON.stringify(columns))
    }

}
document.querySelector('.addColumn').onkeyup = event => {
    if (event.key === "Enter") {
        const columnId = Date.now();
        const title = event.target.value
        document.querySelector('main').innerHTML += ` <div class="column" 
        id="${columnId}" draggable='true'  ondragstart='dragColumn(event);'>
                   
                <div class="tituloColumna">
                <h2 contentEditable onkeydown="preventEnter(event)" onkeyup="changeColumnTitleEnter(event,${columnId})" onBlur="changeColumnTitleBlur(event,${columnId})">${title}</h2>
                <i class="far fa-trash-alt" onclick="removeColumn(${columnId})"></i>
            </div>
                    <div class="tasks" ondragover="preventDefault(event)"  ondrop="drop(event)">
                    </div>
                    <input type="text" onkeyup="addTask(event,${columnId})">
                    </div>`
        const columns = getLocalStorageColumns();
        columns.push({
            id: columnId,
            title,
            tasks: []
        })
        localStorage.setItem('columns', JSON.stringify(columns))
        event.target.value = '';
    }
}

const dragColumn = (event) => {
    event.dataTransfer.setData('number', event.target.id);
    event.target.style.opacity = "0.01";
    //event.target.style.transform = "rotate(20deg)";
}




const dropColumn = (evento) => {
    event.target.style.opacity = "1";
    if (event.target.classList.contains("main")) {
        const id = event.dataTransfer.getData('number', event.target.id);
        const draggableElement = document.getElementById(id);
        const position = Math.floor(evento.pageX / 226.8); //determinamos la posición final de la columna a mover diviendo por el tamañao + el margin
        const columns = getLocalStorageColumns(); //obtenemos las columnas del localStorage
        const currentColumn = columns.find(column => column.id === +id); //buscamos la columna que estamos moviendo
        const updatedColumns = columns.filter(column => column.id !== +id); //quitamos la columna a mover
        updatedColumns.splice(position, 0, currentColumn); //insertamos la columna movida en la posición donde cae
        localStorage.setItem('columns', JSON.stringify(updatedColumns)); //guardamos cambios en localStorage
        renderColumns(updatedColumns); //actualizamos el DOM
    }

}

// document.querySelector('.addColumn').addEventListener('keyup', event => {})