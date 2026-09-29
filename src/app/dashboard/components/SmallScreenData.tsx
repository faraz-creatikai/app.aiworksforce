"use client";

import { BrickWallFire, Podcast, School, Cable, ShieldUser, NotebookTabs, Star } from "lucide-react";
import ImageSlider from "./ImageSlider";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCustomerFieldLabel } from "@/context/customer/CustomerFieldLabelContext";
import { FaCalendar, FaTasks, FaUser, FaUsers } from "react-icons/fa";
const SmallScreenData = () => {
 const { admin, isLoading, login } = useAuth();
     const { getLabel, labels } = useCustomerFieldLabel();
       

  const boxeButtons = [
    {
      pTag: getLabel("Campaign","Campaign"),
      icon: <BrickWallFire size={34} />,
      color: " backdrop-blur-[2px] bg-red-600",
      url: `${admin?.role!=="administrator"?"/masters/campaign/allcampaigns":"/masters/campaign"}`

    },
    {
      pTag: "Customer",
      icon: <FaUser size={34} />,
      color: "backdrop-blur-[2px] bg-purple-600",
      url: "/customer"

    },
    {
      pTag: "Employee",
      icon: <FaUsers size={34} />,
      color: " backdrop-blur-[2px] bg-blue-600",
      url: "/employee-manage"

    },
    {
      pTag: "Task",
      icon: <FaTasks size={34} />,
      color: "backdrop-blur-[2px] bg-teal-600",
      url: "/task"

    },
       {
      pTag: "Attendance",
      icon: <FaCalendar size={34} />,
      color: " backdrop-blur-[2px] bg-green-600",
      url: "/attendance"

    }, 

    
 /*    {
      pTag: "Favorites",
      icon: <Star size={34} />,
      color: " backdrop-blur-[2px] bg-blue-600",
      url: "/favourites"

    }, */
 {
      pTag: "Report",
      icon: <NotebookTabs size={34} />,
      color: "backdrop-blur-[2px] bg-gray-600",
      url: "/reports/activity"
    },
  ];


  //bg-[url(https://i.rtings.com/assets/pages/OICDg5Ss/best-video-editing-laptops-20241015-medium.jpg?format=auto)]

  return (
    <>
      <></>
      <ImageSlider />
      <div className=" flex flex-col mb-2 px-0">

        <div className="">

          {/* ✅ Button Grid */}
          <div className="grid grid-cols-2 gap-2 mt-2 w-full ">
            {boxeButtons.map((data, index) => (
              <Link
                key={index}
                href={data?.url ?? ""}

                className="rounded-sm bg-cover bg-center bg-no-repeat min-h-[152px] "
              >
                <div
                  className={`${data.color} py-9 px-4 rounded-md flex flex-col h-full items-center justify-center`}
                >
                  <div className="text-white">{data.icon}</div>
                  <p className="text-white mt-2 font-semibold text-lg text-center">{data.pTag}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SmallScreenData;
