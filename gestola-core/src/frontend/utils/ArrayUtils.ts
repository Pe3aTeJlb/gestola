export namespace ArrayUtils{

    export function constainsSubArray(array1 : any, array2 : any): boolean {
        if (array1.length === array2.length) {
            return array1.every((element: any) => {
                if (array2.includes(element)) {
                        return true;
                }
                return false;
                });
        }
        return false;
    }
    
}