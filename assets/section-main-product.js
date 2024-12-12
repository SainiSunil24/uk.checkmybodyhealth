if ( typeof ProductPage !== 'function' ) {

	class ProductPage extends HTMLElement {

		constructor(){

			super();

			this.productGallery = this.querySelector('[data-js-product-gallery]');
			this.productSlider = this.querySelector('css-slider');

			this.pickupAvailabilityExtended = this.querySelector('pickup-availability-extended');

			// Gallery thumbnails
			if ( this.productSlider ) {

				const productGaleryThumbnails = this.querySelector('.product-gallery__thumbnails-holder');

				if ( this.querySelector('.product-gallery__thumbnails .thumbnail') ) {

					this.querySelectorAll('.product-gallery__thumbnails .thumbnail').forEach((elm, i)=>{
						if ( i == 0 )  {
							elm.classList.add('active');
						}
						elm.addEventListener('click',e=>{
							if ( this.productSlider.sliderEnabled ) {
								this.productSlider.changeSlide(e.currentTarget.dataset.index);
							} else {
								window.scrollTo({
									top: this.productGallery.querySelector(`.product-gallery-item[data-index="${e.currentTarget.dataset.index}"]`).getBoundingClientRect().top + window.scrollY,
									behavior: 'smooth'
								});
								this.thumbnailNavigationHelper(e.currentTarget.dataset.index);
							}
							this._pauseAllMedia();
							this._playMedia(this.productGallery.querySelector(`.product-gallery-item[data-index="${e.currentTarget.dataset.index}"]`));
							productGaleryThumbnails.scrollTo({
								left: elm.offsetLeft - 50,
								behaviour: 'smooth'
							})
						});
					})

					this.productSlider.addEventListener('change', e=>{
						this.thumbnailNavigationHelper(e.target.index);
					});

				}

				this.productSlider.addEventListener('navigation', e=>{
					this._playMedia(this.productGallery.querySelector(`.product-gallery-item[data-index="${e.target.index}"]`));
				})
				this.productSlider.addEventListener('change', e=>{
					this._pauseAllMedia();
					if ( this.productGallery.querySelector(`.product-gallery-item[data-index="${e.target.index}"]`).dataset.productMediaType == 'model' ) {
						if ( this.xrButton ) {
							this.xrButton.setAttribute('data-shopify-model3d-id', this.productGallery.querySelector(`.product-gallery-item[data-index="${e.target.index}"]`).dataset.mediaId);
						}
						setTimeout(()=>{
							this.productSlider.querySelector('.css-slider-holder').classList.add('css-slider--disable-dragging');
						}, 150);
					}
				});

				// Parallax

				this.productSlider.addEventListener('ready', (e)=>{
					if ( this.firstProductGalleryIndex ) {
						this.productSlider.changeSlide(this.firstProductGalleryIndex, "auto");
					}
				});

			}

			// Product variant event listener for theme specific logic

			this.productVariants = this.querySelector('product-variants[data-main-product-variants]');
			if ( this.productVariants ) {
				this.productVariants.addEventListener('VARIANT_CHANGE', this.onVariantChangeHandler.bind(this));
				this.onVariantChangeHandler({target:this.productVariants});

				// refresh color
				this.querySelectorAll('.product-variant__item--radio').forEach(elm=>{
					elm.addEventListener('click', e=>{
						if ( elm.classList.contains('product-variant__item--color' ) ) {
							elm.closest('.product-variant').querySelector('.product-variant__item-text-label').textContent = elm.querySelector('input').value;
						}
					})
				});

			}

			// show cart drawer when element is added to cart

			if ( ! document.body.classList.contains('template-cart') && KROWN.settings.cart_action == 'overlay' ) {
				
				let addToCartEnter = false;
				if ( this.querySelector('[data-js-product-add-to-cart]') ) {
					this.querySelector('[data-js-product-add-to-cart]').addEventListener('keyup', e=>{
						if ( e.keyCode == window.KEYCODES.RETURN ) {
							addToCartEnter = true;
						}
					})
				}	

				if ( this.querySelector('[data-js-product-form]') ) {
					this.querySelector('[data-js-product-form]').addEventListener('add-to-cart', ()=>{
						document.getElementById('site-cart-sidebar').show();
							if ( document.getElementById('cart-recommendations-sidebar') ) {
							document.getElementById('cart-recommendations-sidebar').generateRecommendations();
						}
						if ( addToCartEnter ) {
							setTimeout(()=>{
								document.querySelector('#site-cart-sidebar [data-js-close]').focus();
							}, 200);
						}
					});
				}

			}

			// Check for models

			const models = this.querySelectorAll('product-model');
			if ( models.length > 0 ) {
				window.ProductModel.loadShopifyXR();
				this.xrButton = this.querySelector('.product-gallery__view-in-space');
			}

			// hide buy now button if stock disabled

			const addToCartButton = this.querySelector('[data-js-product-add-to-cart][data-main-product-add-to-cart]');
			if ( addToCartButton ) {
				if ( addToCartButton.classList.contains('disabled') ) {
					this.querySelector('product-form').classList.add('disable-buy-button');
				} else {
					this.querySelector('product-form').classList.remove('disable-buy-button');
				}
				const buyObserver = new MutationObserver(()=>{
					if ( addToCartButton.classList.contains('disabled') ) {
						this.querySelector('product-form').classList.add('disable-buy-button');
					} else {
						this.querySelector('product-form').classList.remove('disable-buy-button');
					}
				});
				buyObserver.observe(addToCartButton,{ attributes: true, childList: false, subtree: false });
			}

			// update secondary price if present

			this.priceCompact = this.querySelector('[data-js-product-price-compact');
			this.saleNotice = this.querySelector('.sale-notice');
			this.priceExtended = this.querySelector('[data-js-product-price-extended');

			if ( this.priceCompact ) {
				this.priceCompact.priceOriginal = this.priceCompact.querySelector('[data-js-product-price-original]');
				this.priceCompact.priceCompare = this.priceCompact.querySelector('[data-js-product-price-compare]');
				this.priceCompact.priceUnit = this.priceCompact.querySelector('[data-js-product-price-unit]');
			}
			if ( this.priceExtended ) {
				this.priceExtended.priceOriginal = this.priceExtended.querySelector('[data-js-product-price-original]');
				this.priceExtended.priceCompare = this.priceExtended.querySelector('[data-js-product-price-compare]');
				this.priceExtended.priceSaving = this.priceExtended.querySelector('[data-js-product-price-saving]');
				this.priceExtended.priceUnit = this.priceExtended.querySelector('[data-js-product-price-unit]');
			}

		}

		thumbnailNavigationHelper(index=0){
			this.querySelectorAll('.product-gallery__thumbnails .thumbnail').forEach((elm, i)=>{
				if ( i == index )
					elm.classList.add('active');
				else 
					elm.classList.remove('active');
			});
		}

		onVariantChangeHandler(e){

			let variant = e.target.currentVariant;
			if ( variant ) {
				
				// image handling

				if ( variant.featured_media != null ) {
					let variantImg = this.productGallery.querySelector('.product-gallery-item[data-media-id="' + variant.featured_media.id + '"]');
					if ( variantImg ) {
						if ( this.productGallery.classList.contains('product-gallery--slider') || ( this.productGallery.classList.contains('product-gallery--scroll') && window.innerWidth < 1024 ) ) {
							if ( this.productGallery.querySelector('css-slider') && this.productGallery.querySelector('css-slider').sliderEnabled ) {
								this.productGallery.querySelector('css-slider').changeSlide(variantImg.dataset.index);
							} else {
								this.firstProductGalleryIndex = variantImg.dataset.index;
							}
						} else {
							window.scrollTo({
								top: variantImg.getBoundingClientRect().top + window.scrollY,
								behavior: 'smooth'
							});
						}
					}
				}

				// refresh pickup availability widgets

				if ( this.pickupAvailabilityExtended && this.pickupAvailabilityExtended.classList.contains('active') ) {
					this.querySelector('pickup-availability-extended').fetchAvailability(variant.id);
				}

			}

			// update prices (overwrites the framework)

			if ( this.priceCompact ) {
				if ( !variant ) {
					if (!(this.productVariants.variantRequired && this.productVariants.noVariantSelectedYet)) {
						
						this.priceCompact.classList.add('hide');
						this.priceCompact.priceOriginal.innerHTML = '';
						this.priceCompact.priceCompare.innerHTML = '';
						this.priceCompact.priceUnit.innerHTML = '';
					}
				} else {
					console.log('price variant change');
					this.priceCompact.classList.remove('hide');
					this.priceCompact.priceOriginal.innerHTML = this.productVariants._formatMoney(variant.price, KROWN.settings.shop_money_format);
					if (variant.compare_at_price > variant.price) {
						this.saleNotice.classList.remove('hide');
						this.priceCompact.priceCompare.innerHTML = this.productVariants._formatMoney(variant.compare_at_price, KROWN.settings.shop_money_format);
						//this.priceCompact.priceCompare.innerHTML = `<span>${this.productVariants._formatMoney(variant.compare_at_price, KROWN.settings.shop_money_format)}</span><span class="product-item__badge">-${Math.round(Math.abs((variant.price * 100 / variant.compare_at_price) - 100))}%</span>`;
					} else {
						this.saleNotice.classList.add('hide');
						this.priceCompact.priceCompare.innerHTML = '';
					}

					if ( variant.unit_price_measurement ) {
						this.priceCompact.priceUnit.innerHTML = `
							${this.productVariants._formatMoney(variant.unit_price, KROWN.settings.shop_money_format)} / 
							${( variant.unit_price_measurement.reference_value != 1 ? variant.unit_price_measurement.reference_value + ' ' : '' )}
							${variant.unit_price_measurement.reference_unit}
						`;
					} else {
						this.priceCompact.priceUnit.innerHTML = '';
					}
				}
			}

			if ( this.priceExtended ) {
				if ( !variant ) {
					this.priceExtended.classList.add('hide');
					this.priceExtended.priceOriginal.innerHTML = '';
					this.priceExtended.priceCompare.innerHTML = '';
					this.priceExtended.priceUnit.innerHTML = '';
					this.priceExtended.priceSaving.innerHTML = '';
				} else {
					this.priceExtended.classList.remove('hide');
					this.priceExtended.priceOriginal.innerHTML = this.productVariants._formatMoney(variant.price, KROWN.settings.shop_money_format);
					if ( variant.compare_at_price > variant.price ) {
						this.priceExtended.priceCompare.innerHTML = `<span>${this.productVariants._formatMoney(variant.compare_at_price, KROWN.settings.shop_money_format)}</span>`;
						this.priceExtended.priceSaving.innerHTML = `<span>${KROWN.settings.locales.product_compare_price.replace('$SAVE_PRICE', this.productVariants._formatMoney(variant.compare_at_price - variant.price, KROWN.settings.shop_money_format))}</span>`;
					} else {
						this.priceExtended.priceCompare.innerHTML = '';
						this.priceExtended.priceSaving.innerHTML = '';
					}

					if ( variant.unit_price_measurement ) {
						this.priceExtended.priceUnit.innerHTML = `
							${this.productVariants._formatMoney(variant.unit_price, KROWN.settings.shop_money_format)} / 
							${( variant.unit_price_measurement.reference_value != 1 ? variant.unit_price_measurement.reference_value + ' ' : '' )}
							${variant.unit_price_measurement.reference_unit}
						`;
					} else {
						this.priceExtended.priceUnit.innerHTML = '';
					}
				}
			}

		}

		_pauseAllMedia(){

			document.querySelectorAll('.product-gallery .js-youtube').forEach(video => {
				video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
			});
			document.querySelectorAll('.product-gallery .js-vimeo').forEach(video => {
				video.contentWindow.postMessage('{"method":"pause"}', '*');
			});
			document.querySelectorAll('.product-gallery video').forEach(video => video.pause());
			document.querySelectorAll('.product-gallery product-model').forEach(model => {
				if ( model.modelViewerUI ) 
					model.modelViewerUI.pause()
			});
		}
		
		_playMedia(media){
			switch ( media.dataset.productMediaType ) {
				case 'video':
					if ( media.querySelector('video') ) {
						media.querySelector('video').play();
					}
					break;
				case 'external_video-youtube':
					if ( media.querySelector('.js-youtube') ) {
						media.querySelector('.js-youtube').contentWindow.postMessage('{"event":"command","func":"' + 'playVideo' + '","args":""}', '*');
					}
					break;
				case 'external_video-vimeo':
					if ( media.querySelector('.js-vimeo') ) {
						media.querySelector('.js-vimeo').contentWindow.postMessage('{"method":"play"}', '*');
					}
					break;
			}
		}

	}

  if ( typeof customElements.get('product-page') == 'undefined' ) {
		customElements.define('product-page', ProductPage);
	}

}