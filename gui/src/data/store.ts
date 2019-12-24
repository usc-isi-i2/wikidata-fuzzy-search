

/*
 * This class contains the application Store, which holds all the TEI data, annotation data, as well as processed data.
 * We are not using a Redux store here to save time. In the future we might turn this into a Redux store.
 * In the mean time, we have a singleton store instance, which is passed to the root component of the application,
 * (although the singleton can just be accessed by any class)
 */
 class WikiStoreClass {
    public static instance = new WikiStoreClass();
    public status:status = 'init';
;
    private constructor() {
        
 }
}

type status= "init" | "searching";
  
const WikiStore = WikiStoreClass.instance;
export default WikiStoreClass;  // Everybody can just access FvStore.property