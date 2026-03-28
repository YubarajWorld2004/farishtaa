import FarishtaaLogo from "../components/logo/FarishtaaLogo"
import robot from "../assets/Chat.svg"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux";
import {easeInOut, motion} from "framer-motion"
import brain from "../assets/brain.svg"
import translate from "../assets/translate.png"
import doctorIcon from "../assets/doctorIcon.svg"
import { useTranslation } from "react-i18next"

export default function HomePage(){
  const {userId}=useSelector((state)=>state.auth);
  const navigate=useNavigate();
  const { t } = useTranslation();
   return (
     <section className="min-h-screen w-full overflow-x-hidden bg-rose-100 dark:bg-gray-900 relative"> 
       <motion.div className="min-h-[40vh] sm:min-h-[45vh] w-full bg-amber-100 dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-20 place-items-center px-3 sm:px-8 py-6 sm:py-0"
       initial={{opacity : 0 , y:20}}
       animate={{opacity : 1 , y : 0}}
       transition={{duration : 1.2 , ease : easeInOut}}
       
       >
        <div className="flex flex-col justify-center mt-0 px-1 sm:px-2">
              <h1 className="font-bold text-3xl sm:text-5xl font-sans text-red-500 flex items-center gap-1">
                <span>Farishtaa</span>
                <FarishtaaLogo className="w-14 h-14 sm:w-20 sm:h-20" />
              </h1>
             
              <p className="font-bold text-xl sm:text-3xl dark:text-white">{t('home.tagline')}</p>

              <p className="font-medium text-base sm:text-xl text-wrap dark:text-gray-300">{t('home.description')}</p>
                    <div>
                    <button className="bg-red-500 text-white font-bold font-sans px-4 sm:px-5 mt-3 sm:mt-4 border border-red-500 rounded-sm py-2 text-sm sm:text-base transition-transform hover:scale-105" onClick={()=>navigate("/categories")}>{t('home.consultDoctor')}</button>
                </div>
        </div>
        <div className="hidden md:block lg:block">
                <motion.img src={robot} alt="Robot" className="w-[400px] h-80 object-contain" 
                 animate={{y: [0,-10,0]}}
              transition={{
                duration : 4,
                repeat : Infinity,
                ease : easeInOut
              } 
              }            
                />
         </div>
         </motion.div>
         <motion.div className="flex flex-col gap-2"
         initial={{x : -20 , opacity : 0}}
         animate={{x : 0 ,opacity : 1}}
         transition={{duration : 1.2 , ease : "easeInOut" }}
         
         
         >
     <div className="flex items-center mt-2">
       <div className="border-1 border-gray-400 flex-grow opacity-20"/>
       <span className="font-sans text-blue-950 dark:text-white font-bold text-xl sm:text-3xl px-2 mx-2 text-center">{t('home.howHelps')}</span>
       <div className="border-1 border-gray-400 flex-grow opacity-20"/>
     </div>

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 px-3 sm:px-8 pb-8 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-2xl dark:shadow-gray-900/50 rounded-xl p-4 sm:p-6">
         <img src={brain} alt=""  className="h-24 sm:h-40 w-24 sm:w-40 object-contain"/>
         <p className="font-sans text-blue-950 dark:text-white font-bold text-lg sm:text-2xl text-center"><span className="text-red-500">AI</span> {t('home.aiChecker')}</p>
         <p className="text-xs sm:text-sm px-2 sm:px-4 leading-tight font-sans text-center dark:text-gray-400">{t('home.aiCheckerDesc')}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-2xl dark:shadow-gray-900/50 rounded-xl p-4 sm:p-6">
      <img src={doctorIcon} alt=""  className="h-24 sm:h-40 w-full max-w-[200px] sm:max-w-[300px] object-contain"/>
       <p className="font-sans text-blue-950 dark:text-white font-bold text-lg sm:text-2xl text-center">{t('home.doctorConsult')}</p>
         <p className="text-xs sm:text-sm px-2 leading-tight font-sans text-center dark:text-gray-400">{t('home.doctorConsultDesc')}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-2xl dark:shadow-gray-900/50 rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
       <img src={translate} alt="" className="h-24 sm:h-40 w-24 sm:w-40 object-contain mx-auto" />
        <p className="font-sans text-blue-950 dark:text-white font-bold text-lg sm:text-2xl text-center">{t('home.multiLang')}</p>
         <p className="text-xs sm:text-sm px-2 leading-tight font-sans text-center dark:text-gray-400">{t('home.multiLangDesc')}</p>
      </div>
     </div>
  </motion.div>

     </section>
   )
 }