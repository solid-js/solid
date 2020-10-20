


export class ScrollLocker
{

    // ------------------------------------------------------------------------- SINGLETON

    // Our singleton instance
    protected static __INSTANCE	:ScrollLocker;

    /**
     * Get scroll locker instance.
     * @returns {ScrollLocker}
     */
    static get instance ():ScrollLocker
    {
        // If instance does'n exists
        if (ScrollLocker.__INSTANCE == null)
        {
            // Create a new one
            ScrollLocker.__INSTANCE = new ScrollLocker();
        }

        // Return instance
        return ScrollLocker.__INSTANCE;
    }


    // ------------------------------------------------------------------------- DOM

    /**
     * Container to lock.
     */
    $containerToLock			:JQuery;

    // ------------------------------------------------------------------------- LOCALS

    /**
     * Get current lock level.
     * If 0, scroll is unlocked.
     * If more than 0, scroll is locked.
     * Can't be less than 0.
     * @type {number}
     */
    protected _lockLevel						= 0;
    get lockLevel ():number { return this._lockLevel; }


    // ------------------------------------------------------------------------- INIT

    /**
     * Scroll locker constructor.
     * Default container to lock is html + body (to be Mozilla / IE compliant)
     * You can create a custom scroll locker associated to a specific container.
     * @param $pContainerToLock
     */
    constructor ($pContainerToLock = $('html,body'))
    {
        this.$containerToLock = $pContainerToLock;
    }

    // ------------------------------------------------------------------------- PUBLIC

    /**
     * Add a scroll lock.
     * Lock level will increase.
     * If you add 2 lock, you'll need to remove 2 lock to be able to scroll again.
     */
    addLock ()
    {
        // Add lock level
        this._lockLevel ++;

        // Update lock state with new lock level
        this.updateLockState();
    }

    /**
     * Remove a scroll lock.
     * Lock level will decrease.
     * If you remove more lock than added, will throw an error.
     * If you want to cancel all locks without errors, @use unlock()
     * If you want to remove one lock without error, set pThrow argument.
     * @throws Can throw if lock level is less than 0 after remove.
     * @param pThrow Can throw errors if true
     */
    removeLock (pThrow = true)
    {
        // Remove lock level
        this._lockLevel --;

        // Check if our lock level is correct
        if (this._lockLevel < 0 && pThrow)
        {
            throw new Error('ScrollLocker.removeLock // Too many lock removed. Please check your implementation. Ex : Do not remove on click handler with an animation because the user can click several times since the animation ;)');
        }
        else
        {
            // Patch without error
            this._lockLevel = 0;
        }

        // Update lock state with new lock level
        this.updateLockState();
    }

    /**
     * Add one scroll lock if true.
     * Remove one scroll lock if false.
     * If you want to remove one lock without error, set pThrow argument.
     * @param pToggle Adding or removing a scroll lock.
     * @throws Can throw if lock level is less than 0 after remove.
     * @param pThrow Can throw errors if true
     */
    toggleLock (pToggle:boolean, pThrow = true)
    {
        pToggle ? this.addLock() : this.removeLock(pThrow);
    }

    /**
     * Will set the lock level to 1.
     * Override addLock and removeLock usage, use with care.
     */
    lock ()
    {
        // Set lock level
        this._lockLevel = 1;

        // Update lock state with new lock level
        this.updateLockState();
    }

    /**
     * Will set the lock level to 0.
     * Override addLock and removeLock usage, use with care.
     */
    unlock ()
    {
        // Set lock level
        this._lockLevel = 0;

        // Update lock state with new lock level
        this.updateLockState();
    }


    // ------------------------------------------------------------------------- STATE

    /**
     * Update and apply lock state to container from lock level
     */
    updateLockState ()
    {
        this.$containerToLock.css({
            overflow : (this._lockLevel > 0) ? 'hidden' : ''
        });
    }
}