import './App.css'
import {UserAPIProvider} from "./infra/api/UserAPIContext.tsx";
import {RouterProvider} from "./infra/service/RouterContext.tsx";
import {SimpleUserAPI} from "./infra/api/SimpleUserAPI.ts";
import {ReactRouter} from "./infra/service/ReactRouter.ts";

const userAPI = new SimpleUserAPI();
const router = new ReactRouter();

function App() {

  return (
    <RouterProvider router={router}>
      <UserAPIProvider userAPI={userAPI}>
         hello
      </UserAPIProvider>
    </RouterProvider>
  )
}

export default App
