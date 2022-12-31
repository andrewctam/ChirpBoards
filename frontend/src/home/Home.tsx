import React, { useContext, useEffect, useRef, useState } from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp from "./Chirp";
import { PostChirp, UserContext } from "../App";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SpinningCircle from "../SpinningCircle";
import PostComposer from "./PostComposer";
import { PostPayload } from "../App";

export enum Feed { None, Following, Recent, Popular }

function Home() {
    const [feedSelected, setFeedSelected] = useState<Feed>(Feed.None)

    const [recentFeed, setRecentFeed] = useState<JSX.Element[]>([]);
    const [popularFeed, setPopularFeed] = useState<JSX.Element[]>([]);
    const [followingFeed, setFollowingFeed] = useState<JSX.Element[]>([]);
        
    const [recentPageNum, setRecentPageNum] = useState(0);
    const [popularPageNum, setPopularPageNum] = useState(0);
    const [followingPageNum, setFollowingPageNum] = useState(0);

    const [doneFetching, setDoneFetching] = useState(false);
    const userInfo = useContext(UserContext);
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const switchFeeds = (feed: Feed) => {
        setFeedSelected(feed);
        setDoneFetching(false)
        setSearchParams({ feed: feed === Feed.Recent ? "recent" : feed === Feed.Popular ? "popular" : "following" })
    }

    useEffect(() => {
        if (feedSelected !== Feed.None)
            getMoreChirps();

    }, [feedSelected])

    useEffect(() => {
        //on load
        switch (searchParams.get("feed")) {
            case "recent":
                setFeedSelected(Feed.Recent)
                return;
            case "popular":
                setFeedSelected(Feed.Popular)
                return;
            case "following":
                setFeedSelected(Feed.Following)
                return;
            default:
                setFeedSelected(Feed.Recent);
        }

    }, [])


    const getMoreChirps = async () => {
        let type = "";
        let pageNum = 0
        if (feedSelected === Feed.Following) {
            type = "following";
            pageNum = followingPageNum;
        } else if (feedSelected === Feed.Popular) {
            type = "popular";
            pageNum = popularPageNum;
        } else if (feedSelected === Feed.Recent) {
            type = "recent";
            pageNum = recentPageNum;
        } else {
            return;
        }

        let usernameField = "";
        if (feedSelected === Feed.Following)
            usernameField = `, username: "${userInfo.state.username}"`
        else if (userInfo.state.username)
            usernameField = `, relatedUsername: "${userInfo.state.username}"`

        
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query =
            `query {
            ${type}Posts(first: ${pageNum}, offset: 10${usernameField}) {

                id
                text
                author {
                    username
                    displayName
                }
                postDate(timezone: ${timezone})
                score
                ${userInfo.state.username ? "voteStatus" : ""}
            }
        }`

        const response = await fetch(url ?? '', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        }).then(res => res.json())
        console.log(response)

        let info = response.data[`${type}Posts`];
        if (!info)
            return;

        let newChirps = info.map((post: PostPayload) => {
            return <Chirp
                authorUsername={post.author.username}
                authorDisplayName={post.author.displayName}
                id={post.id}
                postDate={post.postDate}
                text={post.text}
                key={"type" + post.id}
                score={post.score}
                voteStatus={userInfo.state.username ? post.voteStatus : 0}
            />
        })

        if (feedSelected === Feed.Recent) {
            setRecentFeed([...recentFeed, ...newChirps]);
            setRecentPageNum(recentPageNum + 1);
        } else if (feedSelected === Feed.Popular) {
            setPopularFeed([...popularFeed, ...newChirps]);
            setPopularPageNum(popularPageNum + 1);
        } else {
            setFollowingFeed([...followingFeed, ...newChirps]);
            setFollowingPageNum(followingPageNum + 1);
        }


        setDoneFetching(true);

    }


    let feed = null;

    switch (feedSelected) {
        case Feed.Recent:
            feed = recentFeed;
            break;
        case Feed.Popular:
            feed = popularFeed;
            break;
        case Feed.Following:
            feed = followingFeed;
            break;
        default:
            break;
    }

    return (<Layout>
        <div className="mt-8 mx-auto w-5/6 lg:w-3/5">
            {userInfo.state.username ?
                <PostComposer />
            : null}

            <div className="grid rows-2">
                <div className="grid grid-cols-3">
                    <FeedButton
                        type={Feed.Recent}
                        name={"Recent"}
                        onClick={switchFeeds}
                        isActive={feedSelected === Feed.Recent} />
                    <FeedButton
                        type={Feed.Popular}
                        name={"Popular"}
                        onClick={switchFeeds}
                        isActive={feedSelected === Feed.Popular} />
                    <FeedButton
                        type={Feed.Following}
                        name={"Following"}
                        onClick={switchFeeds}
                        isActive={feedSelected === Feed.Following} />
                </div>

                <ul>
                    {feed}

                    {feed && feed.length > 0 ?
                        <button className="text-center text-white my-5" onClick = {getMoreChirps}>
                            Load more chirps
                        </button>
                        :
                        !doneFetching ?
                            <SpinningCircle /> 
                        : null}
                </ul>

            </div>
        </div>
    </Layout>)
}



export default Home;
