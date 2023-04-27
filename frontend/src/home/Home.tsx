import { useContext, useState } from "react";
import Layout from "../Layout";
import { UserContext } from "../App";
import PostComposer from "./PostComposer";
import HomeFeed from "./HomeFeed";
import SideInfo from "./SideInfo";

export enum Feed { None, Trending, All, Following }

function Home() {
    const userInfo = useContext(UserContext);

    //flag set when user follows/unfollows someone on the SideInfo
    const [refreshFollowing, setRefreshFollowing] = useState(false);


    return (<Layout>
        {userInfo.state.username ?
            <div className="w-full bg-black/20 shadow-md pt-8">
                <div className="mx-auto w-5/6 lg:w-3/5 py-2">
                    <PostComposer />
                </div>
            </div>
        : null}
        
        <div className="mx-auto grid md:grid-cols-2">
            <HomeFeed 
                refreshFollowing = {refreshFollowing} 
                setRefreshFollowing = {setRefreshFollowing} 
            />

            <SideInfo 
                setRefreshFollowing = {setRefreshFollowing} 
            />
        </div>
    </Layout>)
}



export default Home;
