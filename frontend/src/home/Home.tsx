import { useContext, useEffect, useState } from "react";
import Layout from "../Layout";
import FeedButton from "./FeedButton";
import Chirp from "./Chirp";
import { UserContext } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";
import SpinningCircle from "../SpinningCircle";
import PostComposer from "./PostComposer";
import { PostPayload } from "../App";
import useScrollBottom from "../hooks/useScrollBottom";
import useSort from "../hooks/useSort";

export enum Feed { None, Trending, All, Following }

function Home() {
    const [feedSelected, setFeedSelected] = useState<Feed>(Feed.None)

    const [allFeed, setAllFeed] = useState<JSX.Element[]>([]);
    const [trendingFeed, setTrendingFeed] = useState<JSX.Element[]>([]);
    const [followingFeed, setFollowingFeed] = useState<JSX.Element[] | null>([]);
        
    const [allPageNum, setAllPageNum] = useState(0);
    const [trendingPageNum, setTrendingPageNum] = useState(0);
    const [followingPageNum, setFollowingPageNum] = useState(0);

    const [allHasNextPage, setAllHasNextPage] = useState(true);
    const [trendingHasNextPage, setTrendingHasNextPage] = useState(true);
    const [followingHasNextPage, setFollowingHasNextPage] = useState(true);

    const [doneFetching, setDoneFetching] = useState(false);
    const userInfo = useContext(UserContext);
    const navigate = useNavigate(); 

    const [searchParams, setSearchParams] = useSearchParams();

    const switchFeeds = (feed: Feed) => {
        setFeedSelected(feed);
        setDoneFetching(false);
        setSearchParams({ feed: feed === Feed.All ? "all" : feed === Feed.Trending ? "trending" : "following" })
    }

    useEffect(() => {
        if (feedSelected === Feed.None) //inital page load
            return;

        if (feedSelected === Feed.All && allFeed.length == 0 ||
            feedSelected === Feed.Trending && trendingFeed.length === 0 ||
            feedSelected === Feed.Following && followingFeed && followingFeed.length === 0) {
                getMoreChirps();
            } else {
                setDoneFetching(true)
            }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedSelected])

    useEffect(() => {
        //initial page load
        switch (searchParams.get("feed")) {
            case "all":
                setFeedSelected(Feed.All)
                return;
            case "trending":
                setFeedSelected(Feed.Trending)
                return;
            case "following":
                setFeedSelected(Feed.Following)
                return;
            default:
                setFeedSelected(Feed.All);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps 
    }, [])


    const getMoreChirps = async () => {
        let type = "";
        let pageNum = 0
        if (feedSelected === Feed.Following) {
            if (userInfo.state.username === "") {
                navigate(`/signin?return=${window.location.pathname}`)
                return;
            }
            if (!followingHasNextPage)
                return;
                
            type = "following";
            pageNum = followingPageNum;
        } else if (feedSelected === Feed.Trending) {
            if (!trendingHasNextPage)
                return;

            type = "trending";
            pageNum = trendingPageNum;
        } else if (feedSelected === Feed.All) {
            if (!allHasNextPage)
                return;

            type = "all";
            pageNum = allPageNum;
        } else {
            return;
        }

        let usernameField = "";
        if (feedSelected === Feed.Following) {
            usernameField = `, username: "${userInfo.state.username}"`
        } else if (userInfo.state.username)
        usernameField = `, relatedUsername: "${userInfo.state.username}"`
        
        let sortField = "";
        if (feedSelected === Feed.All || feedSelected === Feed.Following)
            sortField = `, sortMethod: "${sortMethod}"`;

        
        const url = process.env.NODE_ENV !== "production" ? process.env.REACT_APP_DEV_URL : process.env.REACT_APP_PROD_URL
        const timezone = (-(new Date().getTimezoneOffset() / 60)).toString()
        const query =
            `query {
            ${type}Posts(pageNum: ${pageNum}, size: 10${usernameField}${sortField}) {
                posts {
                    id
                    text
                    author {
                        username
                        displayName
                        userColor
                    }
                    postDate(timezone: ${timezone})
                    score
                    ${userInfo.state.username ? "voteStatus" : ""}
                }
                hasNext
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


        const info = response.data[`${type}Posts`];

        if (!info) {
            if (feedSelected === Feed.Following)
                setFollowingFeed(null);

            return;
        }


        const newChirps = info.posts.map((post: PostPayload) => {
            return <Chirp
                authorUsername={post.author.username}
                authorDisplayName={post.author.displayName}
                id={post.id}
                postDate={post.postDate}
                text={post.text}
                key={post.id}
                score={post.score}
                voteStatus={userInfo.state.username ? post.voteStatus : 0}
                userColor={post.author.userColor}
            />
        })

        if (feedSelected === Feed.All) {
            setAllFeed([...allFeed, ...newChirps]);
            setAllPageNum(allPageNum + 1);
            setAllHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Trending) {
            setTrendingFeed([...trendingFeed, ...newChirps]);
            setTrendingPageNum(trendingPageNum + 1);
            setTrendingHasNextPage(info.hasNext);
        } else if (feedSelected === Feed.Following && followingFeed !== null) {
            setFollowingFeed([...followingFeed, ...newChirps]);
            setFollowingPageNum(followingPageNum + 1);
            setFollowingHasNextPage(info.hasNext);
        }

        setDoneFetching(true);

    }

    let msg = null;
    let feed = null;
    switch (feedSelected) {
        case Feed.All:
            feed = allFeed;
            break;
        case Feed.Trending:
            feed = trendingFeed;
            break;
        case Feed.Following:
            if (followingFeed !== null)
                feed = followingFeed;
            else
                msg = "You are not following any users";
            break;
        default:
            break;
    }

    if (feed && feed.length === 0 && doneFetching) {
        console.log(feedSelected)
        msg = "No chirps... other than the crickets chirping!"
        feed = null
    }
    

    useScrollBottom(getMoreChirps)

    const [sortMethod, sortBubble] = useSort(doneFetching, getMoreChirps, () => {
        setAllFeed([])
        setFollowingFeed([])

        setAllPageNum(0)
        setFollowingPageNum(0)

        setAllHasNextPage(true)
        setFollowingHasNextPage(true)
    })
    
    return (<Layout>
        
        {userInfo.state.username ?
            <div className = "w-full bg-black/20 shadow-md pt-8">
                <div className="mx-auto w-5/6 lg:w-3/5 py-2">
                        <PostComposer />
                </div>
            </div> 
        : <div />}

        <div className="mx-auto w-5/6 lg:w-3/5 py-2 mt-4">
            {feedSelected !== Feed.Trending ? sortBubble : null}
            
            <div className="grid grid-cols-3">
                <FeedButton
                    name={"Trending"}
                    onClick={() => switchFeeds(Feed.Trending)}
                    isActive={feedSelected === Feed.Trending} />
                <FeedButton
                    name={"All"}
                    onClick={() => switchFeeds(Feed.All)}
                    isActive={feedSelected === Feed.All} />
                <FeedButton
                    name={"Following"}
                    onClick={() => switchFeeds(Feed.Following)}
                    isActive={feedSelected === Feed.Following} />
            </div>

            <ul className = "mt-6 w-[95%] mx-auto">
                {feed}
                
                <div className = "text-center text-white text-lg mt-4">{msg}</div>

                {!doneFetching ?
                    <SpinningCircle /> 
                : null}
            </ul>
        </div>
    </Layout>)
}



export default Home;
