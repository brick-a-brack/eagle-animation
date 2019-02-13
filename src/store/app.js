import { observable } from 'mobx'

const defaultData = {
    view: 'welcome-screen'
}

export default class ObservableAppStore {

    @observable data = defaultData

    setAppView(view) {
        this.data = {
            ...this.data,
            view
        }
    }
}
