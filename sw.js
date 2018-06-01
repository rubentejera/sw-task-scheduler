importScripts('./src/task.js')

let pendingTasks, doneTasks

self.addEventListener('install', event => {
    pendingTasks = new Set()
    doneTasks = new Set()
    event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim())

    setInterval(function () {
        if (pendingTasks.size !== 0 ) {
            for (task of pendingTasks) {
                if (!task.done && task.date.getTime() <= new Date().getTime()) {
                    task.run().then(task => {
                        self.clients.matchAll().then(clientList => {
                            clientList.forEach(client => {
                                // broadcast a notification message
                                client.postMessage({
                                    kind: 'notification',
                                    notification: {
                                        title: `task ${task.name} has run`,
                                        options: {
                                            body: `at ${task.date}`
                                        }
                                    }
                                })
                            })
                        }).catch(err => console.log(err))
                        doneTasks.add(task)
                        pendingTasks.delete(task)
                    })
                }
            }
        }
    }, 0)
})

self.addEventListener('message', event => {
    switch(event.data.kind) {
        case 'task':
            const task = Object.assign(new Task(), event.data.task)
            pendingTasks.add(task)
            console.log(`task`, task, `added`)
            break
        case 'notification':
            self.registration.showNotification(event.data.notification.title, event.data.notification.options)
            break
        case 'status': 
            console.log(`pending tasks: ${pendingTasks.size}`, pendingTasks)
            console.log(`tasks done: ${doneTasks.size}`, doneTasks)
            break
        case 'default':
            break
    }
})

self.addEventListener('notificationclose', event => {
    console.log(event.notification, `was closed`)
})