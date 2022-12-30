import React, { useContext, useEffect, useRef, useState } from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp from "./Chirp";
import { PostChirp, UserContext } from "../App";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SpinningCircle from "../SpinningCircle";
import PostComposer from "./PostComposer";

export enum Feed { None, Following, Recent, Popular }

function Home() {
    const [feedSelected, setFeedSelected] = useState<Feed>(Feed.None)
    const [recentFeed, setRecentFeed] = useState<JSX.Element[]>([]);
    const [popularFeed, setPopularFeed] = useState<JSX.Element[]>([]);

    const [doneFetching, setDoneFetching] = useState(false);
    const userInfo = useContext(UserContext);
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        switch (feedSelected) {
            case Feed.Recent:
                setDoneFetching(false);
                getRecentPopularChirps("recent");
                setSearchParams({ feed: "recent" })

                return;
            case Feed.Popular:
                setDoneFetching(false);
                getRecentPopularChirps("popular");
                setSearchParams({ feed: "popular" })
                return;
            case Feed.Following:
                if (!userInfo.state.username) {
                    navigate("/signin?return=true")
                } else
                    setSearchParams({ feed: "following" })
                return;

            default:
                return;
        }
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


    const getRecentPopularChirps = async (type: "recent" | "popular") => {
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query =
            `query {
            ${type}Posts${userInfo.state.username ? `(relatedUsername: "${userInfo.state.username}")` : ""} {
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

        if (type === "popular") {
            setPopularFeed(response.data.popularPosts.map((post: any) => {
                return <Chirp
                    authorUsername={post.author.username}
                    authorDisplayName={post.author.displayName}
                    id={post.id}
                    postDate={post.postDate}
                    text={post.text}
                    key={post.id}
                    score={post.score}
                    voteStatus={userInfo.state.username ? post.voteStatus : null}
                />
            }))
        } else {
            setRecentFeed(response.data.recentPosts.map((post: any) => {
                return <Chirp
                    authorUsername={post.author.username}
                    authorDisplayName={post.author.displayName}
                    id={post.id}
                    postDate={post.postDate}
                    text={post.text}
                    key={post.id}
                    score={post.score}
                    voteStatus={userInfo.state.username ? post.voteStatus : null}
                />
            }))
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
            feed = null
            break;
        default:
            break;
    }

    return (<Layout>
        <div className="mt-8 mx-auto w-11/12 md:w-3/4 lg:w-3/5">
            {userInfo.state.username ?
                <PostComposer />
            : null}


            <div className="grid rows-2">
                <div className="grid grid-cols-3">
                    <FeedButton
                        type={Feed.Recent}
                        name={"Recent"}
                        setFeed={setFeedSelected}
                        isActive={feedSelected === Feed.Recent} />
                    <FeedButton
                        type={Feed.Popular}
                        name={"Popular"}
                        setFeed={setFeedSelected}
                        isActive={feedSelected === Feed.Popular} />
                    <FeedButton
                        type={Feed.Following}
                        name={"Following"}
                        setFeed={setFeedSelected}
                        isActive={feedSelected === Feed.Following} />
                </div>

                <ul>
                    {feed}

                    {feed && feed.length > 0 ?
                        <li className="text-center text-white my-5">
                            End of Feed
                        </li>
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
