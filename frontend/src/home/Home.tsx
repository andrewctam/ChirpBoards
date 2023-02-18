import { useContext } from "react";
import Layout from "../Layout";
import { UserContext } from "../App";
import PostComposer from "./PostComposer";
import ChirpFeed from "./ChirpFeed";
import SideInfo from "./SideInfo";

export enum Feed { None, Trending, All, Following }

function Home() {
    const userInfo = useContext(UserContext);

    return (<Layout>
        {userInfo.state.username ?
            <div className="w-full bg-black/20 shadow-md pt-8">
                <div className="mx-auto w-5/6 lg:w-3/5 py-2">
                    <PostComposer />
                </div>
            </div>
        : null}
        
        <div className="mx-auto grid md:grid-cols-2">
            <SideInfo />
            <ChirpFeed />
        </div>
    </Layout>)
}



export default Home;
